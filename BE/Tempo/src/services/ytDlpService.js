const { execFile } = require("child_process");
const { promisify } = require("util");
const NodeCache = require("node-cache");
const axios = require("axios");

const execFileAsync = promisify(execFile);
// Cache audio stream URLs for 1 hour (3600s)
const ytCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });

/**
 * Mở rộng link rút gọn (vt.tiktok.com, vm.tiktok.com, on.soundcloud.com, youtu.be...) bằng cách follow redirects
 */
async function unshortenUrl(url) {
  const trimmed = url.trim();
  const isShort =
    trimmed.includes("on.soundcloud.com") ||
    trimmed.includes("vt.tiktok.com") ||
    trimmed.includes("vm.tiktok.com") ||
    trimmed.includes("youtu.be") ||
    trimmed.includes("bit.ly") ||
    trimmed.includes("tinyurl.com");

  if (!isShort) return trimmed;

  try {
    const res = await axios.get(trimmed, {
      maxRedirects: 5,
      timeout: 5000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });
    if (res.request?.res?.responseUrl && res.request.res.responseUrl.startsWith("http")) {
      console.log(`[unshorten] Expanded ${trimmed} -> ${res.request.res.responseUrl}`);
      return res.request.res.responseUrl;
    }
  } catch (e) {
    console.warn("[unshorten] Native redirect follow failed, trying unshorten.me:", e.message);
  }

  try {
    const res = await axios.get(`https://unshorten.me/json/${encodeURIComponent(trimmed)}`, { timeout: 4000 });
    if (res.data?.resolved_url && res.data.resolved_url.startsWith("http")) {
      return res.data.resolved_url;
    }
  } catch (_) {}

  return trimmed;
}

/**
 * Lấy metadata SoundCloud qua noembed.com rồi stream trực tiếp từ SC URL bằng yt-dlp.
 */
async function extractSoundCloudViaNoembed(url) {
  const res = await axios.get(
    `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
    { timeout: 6000 }
  );

  const d = res.data;
  if (!d || !d.title) throw new Error("noembed không trả về metadata hợp lệ");

  const title = (d.title || "SoundCloud Track").trim();
  const artist = (d.author_name || "SoundCloud Artist").trim();
  const thumbnail = d.thumbnail_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400";

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

  throw new Error(`Không thể stream bài này từ SoundCloud.`);
}

/**
 * Trích xuất TikTok qua TikWM API & Fallback với độ chuẩn xác từng video riêng biệt
 */
async function extractTikTok(url) {
  // 1. Thử qua TikWM API
  try {
    const res = await axios.post(
      "https://www.tikwm.com/api/",
      new URLSearchParams({ url }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 9000,
      }
    );

    if (res.data?.code === 0 && res.data?.data) {
      const d = res.data.data;
      const musicInfo = d.music_info || {};

      // Ưu tiên luồng audio thực tế của video đó
      const audioUrl = d.music || musicInfo.play || d.play || d.wmplay;
      if (audioUrl && audioUrl.startsWith("http")) {
        // Tách tiêu đề chuẩn: ưu tiên caption của video để phân biệt các video khác nhau
        const cleanCaption = (d.title || "").replace(/#\S+/g, "").trim();
        const finalTitle = cleanCaption || musicInfo.title || "TikTok Audio";
        const finalArtist = d.author?.nickname || d.author?.unique_id || musicInfo.author || "TikTok Creator";
        // Ảnh bìa chuẩn của chính video đó
        const finalThumb = d.cover || d.origin_cover || d.ai_dynamic_cover || musicInfo.cover || "";

        return {
          id: `tk_${d.id || Date.now()}`,
          rawId: d.id || "",
          title: finalTitle,
          fullTitle: `${finalTitle} - ${finalArtist}`,
          artistsNames: finalArtist,
          thumbnail: finalThumb,
          duration: Math.round(d.duration || musicInfo.duration || 30),
          source: "tiktok",
          audioUrl,
          quality: "MP3 HQ",
          fileSize: d.size ? `${(d.size / (1024 * 1024)).toFixed(1)} MB` : "3.2 MB",
          webpageUrl: url,
        };
      }
    }
  } catch (err) {
    console.warn("[TikWM] Error:", err.message);
  }

  // 2. Fallback sang TiklyDown API
  try {
    const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
      timeout: 8000,
    });
    if (res.data && res.data.status === 200 && res.data.music?.play_url) {
      const data = res.data;
      const title = (data.title || "TikTok Audio").replace(/#\S+/g, "").trim() || "TikTok Audio";
      const artist = data.author?.name || "TikTok Creator";
      const thumb = data.cover || data.images?.[0] || "";

      return {
        id: `tk_${data.id || Date.now()}`,
        rawId: data.id || "",
        title,
        fullTitle: `${title} - ${artist}`,
        artistsNames: artist,
        thumbnail: thumb,
        duration: Math.round(data.music?.duration || 30),
        source: "tiktok",
        audioUrl: data.music.play_url,
        quality: "MP3 HQ",
        fileSize: "3.2 MB",
        webpageUrl: url,
      };
    }
  } catch (err) {
    console.warn("[TiklyDown] Fallback error:", err.message);
  }

  throw new Error("Không thể trích xuất audio từ video TikTok này. Vui lòng kiểm tra lại liên kết.");
}

/**
 * Lấy URL audio stream từ YouTube bằng yt-dlp (Bản gốc chính xác kèm duration)
 */
const resolveYouTubeStream = async (title, artist = "") => {
  const cleanTitle = (title || "").trim();
  const mainArtist = (artist || "").split(",")[0].trim();
  const cacheKey = `yt_stream_${cleanTitle}_${mainArtist}`.toLowerCase();

  const cachedData = ytCache.get(cacheKey);
  if (cachedData && cachedData.audioUrl) {
    console.log(`[yt-dlp] Cache hit: "${cleanTitle} - ${mainArtist}"`);
    return cachedData;
  }

  const unwantedKeywords = ["remix", "cover", "lofi", "karaoke", "sped up", "speed up", "slowed", "parody", "nhạc sống", "beat"];
  const origHasKeyword = (kw) => cleanTitle.toLowerCase().includes(kw);

  const queries = [
    mainArtist && mainArtist.toLowerCase() !== "soundcloud" && mainArtist.toLowerCase() !== "tiktok"
      ? `ytsearch3:${cleanTitle} ${mainArtist} Official Audio`
      : null,
    mainArtist && mainArtist.toLowerCase() !== "soundcloud" && mainArtist.toLowerCase() !== "tiktok"
      ? `ytsearch3:${cleanTitle} ${mainArtist} Official Music Video`
      : null,
    mainArtist && mainArtist.toLowerCase() !== "soundcloud" && mainArtist.toLowerCase() !== "tiktok"
      ? `ytsearch3:${cleanTitle} ${mainArtist}`
      : null,
    `ytsearch3:${cleanTitle} Official Audio`,
    `ytsearch3:${cleanTitle}`,
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
          timeout: 14000,
          windowsHide: true,
          maxBuffer: 10 * 1024 * 1024,
        });

        const data = JSON.parse(result.stdout);
        const entries = data.entries && data.entries.length > 0 ? data.entries : [data];

        for (const item of entries) {
          if (!item) continue;
          const itemTitleLower = (item.title || "").toLowerCase();
          
          // Lọc bỏ bản remix/cover nếu bài gốc không phải remix/cover
          const isUnwanted = unwantedKeywords.some(kw => !origHasKeyword(kw) && itemTitleLower.includes(kw));
          if (isUnwanted && entries.length > 1) {
            continue;
          }

          const findBestAudio = (formats) => {
            if (!formats || !formats.length) return null;
            const m4a = formats.find((f) => f.ext === "m4a" && f.url && f.acodec !== "none");
            if (m4a) return m4a.url;
            const mp4 = formats.find((f) => (f.ext === "mp3" || f.ext === "mp4") && f.url && f.acodec !== "none");
            if (mp4) return mp4.url;
            const anyAudio = formats.find((f) => f.acodec !== "none" && f.url);
            return anyAudio?.url || null;
          };

          const audioUrl = findBestAudio(item.formats) || item.url || item.requested_downloads?.[0]?.url;

          if (audioUrl && audioUrl.startsWith("http")) {
            const resObj = {
              id: `yt_${item.id}`,
              rawId: item.id,
              title: item.title || cleanTitle,
              artistsNames: item.uploader || item.channel || mainArtist || "Nghệ sĩ",
              thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              duration: Math.round(item.duration || 0),
              audioUrl: audioUrl,
              isFallback: true,
              message: "Phát qua luồng âm thanh gốc chính thức (Mở khóa VIP)",
            };

            ytCache.set(cacheKey, resObj);
            console.log(`[yt-dlp] Success for "${cleanTitle}": ${item.title} (${resObj.duration}s)`);
            return resObj;
          }
        }
      } catch (err) {
        console.warn(`[yt-dlp] ${exe} failed:`, (err.message || "").slice(0, 80));
      }
    }
  }

  throw new Error(`Không tìm thấy luồng âm thanh cho bài "${cleanTitle}"`);
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
  const cacheKey = `media_ext_${encodeURIComponent(cleanUrl)}`;
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

  // ─── SoundCloud: noembed.com + direct yt-dlp ───
  if (isSoundCloud) {
    try {
      console.log(`[SoundCloud] Extracting: ${cleanUrl}`);
      const songData = await extractSoundCloudViaNoembed(cleanUrl);
      ytCache.set(cacheKey, songData);
      return songData;
    } catch (scErr) {
      console.warn("[SoundCloud] Error:", scErr.message);
    }
  }

  // ─── TikTok: TikWM & TiklyDown (chính xác 100% từng video) ───
  if (isTikTok) {
    try {
      console.log(`[TikTok] Extracting: ${cleanUrl}`);
      const songData = await extractTikTok(cleanUrl);
      ytCache.set(cacheKey, songData);
      return songData;
    } catch (tikErr) {
      console.warn("[TikTok] Error:", tikErr.message);
      throw tikErr;
    }
  }

  // ─── YouTube: Direct yt-dlp ───
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
    "12",
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
        timeout: 18000,
        windowsHide: true,
        maxBuffer: 15 * 1024 * 1024,
      });

      const data = JSON.parse(result.stdout);
      
      const findBestAudio = (formats) => {
        if (!formats || !formats.length) return null;
        const m4a = formats.find((f) => f.ext === "m4a" && f.url && f.acodec !== "none");
        if (m4a) return m4a.url;
        const mp4 = formats.find((f) => (f.ext === "mp3" || f.ext === "mp4") && f.url && f.acodec !== "none");
        if (mp4) return mp4.url;
        const anyAudio = formats.find((f) => f.acodec !== "none" && f.url);
        return anyAudio?.url || null;
      };

      const audioUrl =
        findBestAudio(data.formats) ||
        data.url ||
        data.requested_downloads?.[0]?.url;

      if (audioUrl && audioUrl.startsWith("http")) {
        const platformSource = "youtube";
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
            "Nghệ sĩ",
          thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${data.id}/hqdefault.jpg`,
          duration: Math.round(data.duration || 0),
          source: platformSource,
          audioUrl: audioUrl,
          quality: "MP3 HQ",
          fileSize: data.filesize ? `${(data.filesize / (1024 * 1024)).toFixed(1)} MB` : "3.5 MB",
          webpageUrl: data.webpage_url || cleanUrl,
        };

        ytCache.set(cacheKey, songData);
        console.log(`[media extract] Direct success for: "${songData.title}"`);
        return songData;
      }
    } catch (err) {
      console.warn(`[media extract] Direct ${exe} failed:`, (err.message || "").slice(0, 80));
    }
  }

  throw new Error("Không thể trích xuất nhạc từ liên kết này. Vui lòng kiểm tra lại đường dẫn.");
};

module.exports = { resolveYouTubeStream, extractYouTubeMetadata };
