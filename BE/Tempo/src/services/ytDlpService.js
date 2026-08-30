const { execFile } = require("child_process");
const { promisify } = require("util");
const NodeCache = require("node-cache");
const axios = require("axios");

const execFileAsync = promisify(execFile);
// Cache audio stream URLs for 2 hours (7200s)
const ytCache = new NodeCache({ stdTTL: 7200, checkperiod: 600 });

/**
 * Mở rộng link rút gọn (on.soundcloud.com, vt.tiktok.com, youtu.be...)
 */
async function unshortenUrl(url) {
  const isShort =
    url.includes("on.soundcloud.com") ||
    url.includes("vt.tiktok.com") ||
    url.includes("vm.tiktok.com") ||
    url.includes("bit.ly") ||
    url.includes("tinyurl.com");

  if (!isShort) return url;

  try {
    const res = await axios.get(`https://unshorten.me/json/${encodeURIComponent(url)}`, { timeout: 4500 });
    if (res.data && res.data.resolved_url && res.data.resolved_url.startsWith("http")) {
      console.log(`[unshorten] Resolved ${url} -> ${res.data.resolved_url}`);
      return res.data.resolved_url;
    }
  } catch (e) {
    console.warn("[unshorten] unshorten.me error:", e.message);
  }

  // Fallback 2: parse URL path directly if it has slug
  return url;
}

function parseSoundCloudSlug(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const artist = parts[0].replace(/[-_]/g, " ").trim();
      const title = parts[1].replace(/[-_]/g, " ").trim();
      return { artist, title };
    } else if (parts.length === 1) {
      return { title: parts[0].replace(/[-_]/g, " ").trim(), artist: "SoundCloud" };
    }
  } catch (e) {}
  return null;
}

/**
 * Lấy metadata SoundCloud qua noembed.com rồi stream trực tiếp từ SC URL bằng yt-dlp.
 * KHÔNG fallback YouTube search — nếu không lấy được thì báo lỗi thẳng.
 */
async function extractSoundCloudViaNoembed(url) {
  // 1. Lấy metadata (title, artist, thumbnail)
  const res = await axios.get(
    `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
    { timeout: 6000 }
  );

  const d = res.data;
  if (!d || !d.title) throw new Error("noembed không trả về metadata hợp lệ");

  const title = (d.title || "SoundCloud Track").trim();
  const artist = (d.author_name || "SoundCloud Artist").trim();
  const thumbnail = d.thumbnail_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400";

  console.log(`[noembed] SoundCloud metadata: "${title}" - ${artist}`);

  // 2. Stream trực tiếp từ SoundCloud URL bằng yt-dlp (không search YouTube)
  const directArgs = [
    "--no-playlist",
    "--js-runtimes", "node",
    "--format", "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio/best",
    "--dump-single-json",
    "--no-warnings",
    "--quiet",
    "--socket-timeout", "12",
    url,
  ];

  const candidates = [
    { exe: "python3", args: ["-m", "yt_dlp", ...directArgs] },
    { exe: "python", args: ["-m", "yt_dlp", ...directArgs] },
    { exe: "yt-dlp", args: directArgs },
    { exe: "/home/render/.local/bin/yt-dlp", args: directArgs },
    { exe: "/usr/local/bin/yt-dlp", args: directArgs },
  ];

  for (const { exe, args } of candidates) {
    try {
      const result = await execFileAsync(exe, args, {
        timeout: 15000,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      });

      const data = JSON.parse(result.stdout);
      const audioUrl = data.url || data.requested_downloads?.[0]?.url;

      if (audioUrl && audioUrl.startsWith("http")) {
        console.log(`[SC direct] Got stream: "${data.title}" (${data.duration}s)`);
        return {
          id: `sc_${data.id || Date.now()}`,
          rawId: data.id || title,
          title: data.title || title,
          fullTitle: `${data.title || title} - ${artist}`,
          artistsNames: data.uploader || artist,
          thumbnail: data.thumbnail || thumbnail,
          duration: Math.round(data.duration || 0),
          source: "soundcloud",
          audioUrl,
          quality: "MP3 HQ",
          fileSize: data.filesize
            ? `${(data.filesize / (1024 * 1024)).toFixed(1)} MB`
            : data.duration
            ? `${((data.duration * 128 * 1024) / (8 * 1024 * 1024)).toFixed(1)} MB`
            : "4.2 MB",
          webpageUrl: url,
        };
      }
    } catch (err) {
      console.warn(`[SC direct] ${exe} failed:`, (err.message || "").slice(0, 80));
    }
  }

  // Không tìm được — báo lỗi thẳng, không trả bài sai
  throw new Error(`Không thể stream bài này từ SoundCloud. Vui lòng thử lại hoặc kiểm tra kết nối.`);
}

/**
 * Trích xuất TikTok qua TikWM API - lấy đúng metadata & audio stream gốc
 */
async function extractTikTokViaTikWM(url) {
  const res = await axios.post(
    "https://www.tikwm.com/api/",
    new URLSearchParams({ url }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 8000,
    }
  );

  if (res.data?.code !== 0 || !res.data?.data) {
    throw new Error("TikWM không trả về dữ liệu hợp lệ");
  }

  const d = res.data.data;
  const musicInfo = d.music_info || {};

  // Ưu tiên URL nhạc riêng, fallback sang video không watermark
  const audioUrl = musicInfo.play || d.music || d.play || d.wmplay;
  if (!audioUrl) throw new Error("Không tìm thấy luồng audio từ TikTok");

  const rawTitle = (d.title || musicInfo.title || "TikTok Audio").replace(/#\S+/g, "").trim();
  const artist = musicInfo.author || d.author?.nickname || "TikTok Creator";
  const thumbnail = musicInfo.cover || d.cover || d.ai_dynamic_cover || "";

  return {
    id: `tk_${d.id || Date.now()}`,
    rawId: d.id || "",
    title: rawTitle || "TikTok Audio",
    fullTitle: `${rawTitle} - ${artist}`,
    artistsNames: artist,
    thumbnail,
    duration: Math.round(d.duration || musicInfo.duration || 60),
    source: "tiktok",
    audioUrl,
    quality: "MP3 HQ",
    fileSize: d.size ? `${(d.size / (1024 * 1024)).toFixed(1)} MB` : "3.5 MB",
    webpageUrl: url,
  };
}

/**
 * Lấy URL audio stream từ YouTube bằng yt-dlp (Bản gốc chính xác kèm duration)
 * @param {string} title - Tên bài hát
 * @param {string} artist - Tên nghệ sĩ
 */
const resolveYouTubeStream = async (title, artist = "") => {
  const cleanTitle = (title || "").trim();
  const mainArtist = (artist || "").split(",")[0].trim();
  const cacheKey = `yt_stream_${cleanTitle}_${mainArtist}`.toLowerCase();

  // 1. Kiểm tra Cache trước
  const cachedData = ytCache.get(cacheKey);
  if (cachedData && cachedData.audioUrl) {
    console.log(`[yt-dlp] Cache hit: "${cleanTitle} - ${mainArtist}"`);
    return cachedData;
  }

  const queries = [
    mainArtist && mainArtist.toLowerCase() !== "soundcloud" && mainArtist.toLowerCase() !== "tiktok"
      ? `ytsearch1:${cleanTitle} ${mainArtist}`
      : null,
    `ytsearch1:${cleanTitle}`,
    `ytsearch1:${cleanTitle} audio`,
  ].filter(Boolean);

  for (const query of queries) {
    const baseArgs = [
      "--no-playlist",
      "--js-runtimes",
      "node",
      "--format",
      "bestaudio[ext=m4a]/bestaudio[ext=mp3]/best[ext=mp4]/bestaudio/best",
      "--dump-single-json",
      "--no-warnings",
      "--quiet",
      "--socket-timeout",
      "10",
      query,
    ];

    const execCandidates = [
      { exe: "python3", args: ["-m", "yt_dlp", ...baseArgs] },
      { exe: "python", args: ["-m", "yt_dlp", ...baseArgs] },
      { exe: "yt-dlp", args: baseArgs },
      { exe: "/home/render/.local/bin/yt-dlp", args: baseArgs },
      { exe: "/usr/local/bin/yt-dlp", args: baseArgs },
    ];

    for (const { exe, args } of execCandidates) {
      try {
        const result = await execFileAsync(exe, args, {
          timeout: 12000,
          windowsHide: true,
        });

        const raw = JSON.parse(result.stdout);
        const item = raw.entries ? raw.entries[0] : raw;

        if (item && item.url) {
          console.log(`[yt-dlp ${exe}] OK - Found: "${item.title}" (Duration: ${item.duration}s)`);
          const streamInfo = {
            audioUrl: item.url,
            duration: item.duration || 0,
            thumbnail: item.thumbnail || null,
            quality: "original_master",
            isFallback: true,
            fallbackSource: "youtube_original",
            message: `Đang phát bản gốc (${mainArtist || cleanTitle})`,
          };

          ytCache.set(cacheKey, streamInfo);
          return streamInfo;
        }
      } catch (err) {
        // Fallback to next candidate
      }
    }
  }

  throw new Error("Không thể tìm thấy luồng audio gốc từ YouTube");
};

/**
 * Trích xuất Metadata và Audio Stream từ liên kết YouTube, SoundCloud, TikTok (Universal Audio Extractor)
 * @param {string} rawUrl - Link YouTube, SoundCloud, TikTok (hỗ trợ cả link rút gọn)
 */
const extractYouTubeMetadata = async (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("Vui lòng cung cấp đường dẫn hợp lệ");
  }

  const cleanUrl = await unshortenUrl(rawUrl.trim());
  const cacheKey = `yt_extract_${cleanUrl}`;
  const cached = ytCache.get(cacheKey);
  if (cached) {
    console.log(`[media extract] Cache hit for: ${cleanUrl}`);
    return cached;
  }

  const isSoundCloud =
    cleanUrl.includes("soundcloud.com") ||
    rawUrl.includes("soundcloud.com") ||
    rawUrl.includes("on.soundcloud.com");
  const isTikTok =
    cleanUrl.includes("tiktok.com") ||
    rawUrl.includes("tiktok.com") ||
    rawUrl.includes("vt.tiktok.com") ||
    rawUrl.includes("vm.tiktok.com");

  // ─── SoundCloud: dùng noembed.com để lấy đúng metadata + tìm audio YouTube ───
  if (isSoundCloud) {
    try {
      console.log(`[noembed] Extracting SoundCloud: ${cleanUrl}`);
      const songData = await extractSoundCloudViaNoembed(cleanUrl);
      ytCache.set(cacheKey, songData);
      console.log(`[noembed] Success: "${songData.title}" - ${songData.artistsNames}`);
      return songData;
    } catch (scErr) {
      console.warn("[noembed] Failed, falling back to yt-dlp:", scErr.message);
    }
  }

  // ─── TikTok: dùng TikWM API để lấy đúng metadata + audio stream gốc ───
  if (isTikTok) {
    try {
      console.log(`[TikWM] Extracting TikTok: ${rawUrl}`);
      const songData = await extractTikTokViaTikWM(rawUrl);
      ytCache.set(cacheKey, songData);
      console.log(`[TikWM] Success: "${songData.title}" - ${songData.artistsNames}`);
      return songData;
    } catch (tikErr) {
      console.warn("[TikWM] Failed, falling back to yt-dlp:", tikErr.message);
    }
  }

  const baseArgs = [
    "--no-playlist",
    "--js-runtimes",
    "node",
    "--format",
    "bestaudio[ext=m4a]/bestaudio[ext=mp3]/best[ext=mp4]/bestaudio/best",
    "--dump-single-json",
    "--no-warnings",
    "--quiet",
    "--socket-timeout",
    isSoundCloud ? "4" : "12",
    cleanUrl,
  ];

  const strategies = [
    { exe: "python3", args: ["-m", "yt_dlp", ...baseArgs] },
    { exe: "python", args: ["-m", "yt_dlp", ...baseArgs] },
    { exe: "yt-dlp", args: baseArgs },
    { exe: "/home/render/.local/bin/yt-dlp", args: baseArgs },
    { exe: "/usr/local/bin/yt-dlp", args: baseArgs },
  ];

  for (const { exe, args } of strategies) {
    try {
      const result = await execFileAsync(exe, args, {
        timeout: isSoundCloud || isTikTok ? 5000 : 18000,
        windowsHide: true,
        maxBuffer: 15 * 1024 * 1024,
      });

      const data = JSON.parse(result.stdout);
      
      // Chọn định dạng audio tương thích 100% với iOS AVPlayer & Android
      const findBestAudio = (formats) => {
        if (!formats || !formats.length) return null;
        const m4a = formats.find((f) => f.ext === "m4a" && f.url && f.acodec !== "none");
        if (m4a) return m4a.url;
        const mp4 = formats.find((f) => (f.ext === "mp3" || f.ext === "mp4") && f.url && f.acodec !== "none");
        if (mp4) return mp4.url;
        const anyNonWebm = formats.find((f) => f.ext !== "webm" && f.url && f.acodec !== "none");
        if (anyNonWebm) return anyNonWebm.url;
        const anyAudio = formats.find((f) => f.acodec !== "none" && f.url);
        return anyAudio?.url || null;
      };

      const audioUrl =
        findBestAudio(data.formats) ||
        data.url ||
        data.requested_downloads?.[0]?.url;

      if (audioUrl && audioUrl.startsWith("http")) {
        let platformSource = "youtube";
        if (isSoundCloud) platformSource = "soundcloud";
        else if (isTikTok) platformSource = "tiktok";
        else if (data.extractor) platformSource = data.extractor.toLowerCase();

        const songData = {
          id: `${platformSource}_${data.id || Date.now()}`,
          rawId: data.id,
          title: (data.title || "Âm thanh trích xuất").replace(/\[.*?\]|\(.*?\)/g, "").trim() || data.title,
          fullTitle: data.title,
          artistsNames:
            data.uploader ||
            data.channel ||
            data.artist ||
            data.creator ||
            (isSoundCloud ? "SoundCloud Artist" : isTikTok ? "TikTok Creator" : "Nghệ sĩ"),
          thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${data.id}/hqdefault.jpg`,
          duration: Math.round(data.duration || 0),
          source: platformSource,
          audioUrl: audioUrl,
          quality: "MP3 HQ",
          fileSize: data.filesize ? `${(data.filesize / (1024 * 1024)).toFixed(1)} MB` : "3.5 MB",
          webpageUrl: data.webpage_url || cleanUrl,
        };

        ytCache.set(cacheKey, songData);
        console.log(`[media extract] Direct success for: "${songData.title}" (${platformSource})`);
        return songData;
      }
    } catch (err) {
      console.warn(`[media extract] Direct ${exe} failed:`, (err.message || "").slice(0, 80));
    }
  }

  // TikTok đã được xử lý hoàn toàn qua TikWM ở trên, không cần fallback thêm
  if (isTikTok) {
    throw new Error("Không thể trích xuất audio TikTok. Vui lòng thử lại hoặc kiểm tra kết nối mạng.");
  }

  throw new Error("Không thể trích xuất nhạc từ liên kết này. Vui lòng kiểm tra lại đường dẫn (hỗ trợ YouTube, SoundCloud, TikTok).");
};

module.exports = { resolveYouTubeStream, extractYouTubeMetadata };
