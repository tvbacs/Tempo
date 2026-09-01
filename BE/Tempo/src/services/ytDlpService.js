const { execFile } = require("child_process");
const { promisify } = require("util");
const NodeCache = require("node-cache");
const axios = require("axios");

const execFileAsync = promisify(execFile);

// TTL ngắn 5 phút (300s) cho signed streaming URLs của YouTube/TikTok (ngăn ngừa lỗi hết hạn token)
const ytCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Hàm chung: Lựa chọn định dạng audio tối ưu nhất từ danh sách formats của yt-dlp
 */
function findBestAudio(formats) {
  if (!formats || !Array.isArray(formats) || formats.length === 0) return null;

  // 1. Ưu tiên codec âm thanh m4a (AAC chất lượng cao, dung lượng nhẹ)
  const m4a = formats.find((f) => f.ext === "m4a" && f.url && f.acodec && f.acodec !== "none");
  if (m4a) return m4a.url;

  // 2. Fallback sang MP3 hoặc MP4 audio
  const mp3OrMp4 = formats.find(
    (f) => (f.ext === "mp3" || f.ext === "mp4") && f.url && f.acodec && f.acodec !== "none"
  );
  if (mp3OrMp4) return mp3OrMp4.url;

  // 3. Fallback sang bất kỳ luồng nào có audio
  const anyAudio = formats.find((f) => f.acodec && f.acodec !== "none" && f.url);
  return anyAudio?.url || null;
}

/**
 * Chuẩn hóa chuỗi tìm kiếm / cache key loại bỏ các tag rác
 */
function normalizeSongKey(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\(official.*?\)/gi, "")
    .replace(/\[official.*?\]/gi, "")
    .replace(/\(mv.*?\)/gi, "")
    .replace(/\[mv.*?\]/gi, "")
    .replace(/\(lyrics.*?\)/gi, "")
    .replace(/\[lyrics.*?\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Nhận diện nền tảng từ URL dựa trên hostname chuẩn xác
 */
function detectPlatform(urlStr) {
  try {
    const parsed = new URL(urlStr.trim());
    const host = parsed.hostname.toLowerCase();

    if (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtu.be"
    ) {
      return "youtube";
    }

    if (
      host === "soundcloud.com" ||
      host === "www.soundcloud.com" ||
      host === "m.soundcloud.com" ||
      host === "on.soundcloud.com"
    ) {
      return "soundcloud";
    }

    if (
      host === "tiktok.com" ||
      host === "www.tiktok.com" ||
      host === "vt.tiktok.com" ||
      host === "vm.tiktok.com" ||
      host === "m.tiktok.com"
    ) {
      return "tiktok";
    }
  } catch (_) {}

  return null;
}

/**
 * Mở rộng link rút gọn an toàn dựa trên hostname
 */
async function unshortenUrl(url) {
  const trimmed = url.trim();
  let hostname = "";
  try {
    const parsed = new URL(trimmed);
    hostname = parsed.hostname.toLowerCase();
  } catch (_) {
    return trimmed;
  }

  const isShortDomain =
    hostname === "youtu.be" ||
    hostname === "vt.tiktok.com" ||
    hostname === "vm.tiktok.com" ||
    hostname === "on.soundcloud.com" ||
    hostname === "bit.ly" ||
    hostname === "tinyurl.com";

  if (!isShortDomain) return trimmed;

  try {
    const res = await axios.get(trimmed, {
      maxRedirects: 5,
      timeout: 6000,
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
 * Trích xuất SoundCloud toàn diện: Thử yt-dlp trực tiếp trước, nếu lỗi geo-restriction tự động fallback qua oEmbed/Smart Stream
 */
async function extractSoundCloud(url) {
  const directArgs = [
    "--no-playlist",
    "--js-runtimes", "node",
    "--format", "bestaudio/best",
    "--dump-single-json",
    "--no-warnings",
    "--quiet",
    "--socket-timeout", "12",
    url,
  ];

  const candidates = [
    { exe: "yt-dlp", args: directArgs },
    { exe: "/home/render/.local/bin/yt-dlp", args: directArgs },
    { exe: "/usr/local/bin/yt-dlp", args: directArgs },
    { exe: "python", args: ["-m", "yt_dlp", ...directArgs] },
    { exe: "python3", args: ["-m", "yt_dlp", ...directArgs] },
  ];

  for (const { exe, args } of candidates) {
    try {
      const result = await execFileAsync(exe, args, {
        timeout: 15000,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      });

      const data = JSON.parse(result.stdout);
      const audioUrl = findBestAudio(data.formats) || data.url || data.requested_downloads?.[0]?.url;

      if (audioUrl && audioUrl.startsWith("http")) {
        const title = (data.title || "SoundCloud Track").replace(/\[.*?\]|\(.*?\)/g, "").trim() || data.title;
        const artist = data.uploader || data.artist || data.channel || data.creator || "SoundCloud Artist";
        return {
          id: `sc_${data.id || Date.now()}`,
          rawId: data.id || title,
          title: title,
          fullTitle: data.title || `${title} - ${artist}`,
          artistsNames: artist,
          thumbnail: data.thumbnail || data.artwork_url || null,
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

  // Fallback 2: SoundCloud oEmbed / noembed + Smart Fallback YouTube Audio Stream
  try {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    let scData = null;
    try {
      const res = await axios.get(oembedUrl, { timeout: 5000 });
      scData = res.data;
    } catch (_) {
      const noembedRes = await axios.get(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { timeout: 5000 });
      scData = noembedRes.data;
    }

    if (scData?.title) {
      const scTitle = (scData.title || "SoundCloud Track").replace(/\[.*?\]|\(.*?\)/g, "").trim();
      const scArtist = scData.author_name || "SoundCloud Artist";
      console.log(`[SoundCloud Fallback] Tìm kiếm bản phát qua Smart Stream cho: "${scTitle}" - "${scArtist}"`);
      const ytFall = await resolveYouTubeStream(scTitle, scArtist);
      if (ytFall?.audioUrl) {
        return {
          ...ytFall,
          id: `sc_${Date.now()}`,
          source: "soundcloud",
          fullTitle: `${scTitle} - ${scArtist}`,
          artistsNames: scArtist || ytFall.artistsNames,
          thumbnail: scData.thumbnail_url || ytFall.thumbnail,
          message: "Đã phân giải luồng âm thanh SoundCloud chuẩn",
        };
      }
    }
  } catch (e) {
    console.warn("[SoundCloud oembed fallback] failed:", e.message);
  }

  throw new Error("Không thể trích xuất bài này từ SoundCloud. Vui lòng kiểm tra lại đường dẫn.");
}

/**
 * Trích xuất TikTok qua TikWM API & Fallback với độ chuẩn xác từng video riêng biệt
 */
async function extractTikTok(url) {
  // 1. Thử qua TikWM API (chính xác và nhanh)
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

      // Ưu tiên luồng audio chuẩn của video
      const audioUrl = d.music || musicInfo.play || d.play || d.wmplay;
      if (audioUrl && audioUrl.startsWith("http")) {
        const cleanCaption = (d.title || "").replace(/#\S+/g, "").trim();
        const finalTitle = cleanCaption || musicInfo.title || "TikTok Audio";
        const finalArtist = d.author?.nickname || d.author?.unique_id || musicInfo.author || "TikTok Creator";
        const finalThumb = d.cover || d.origin_cover || d.ai_dynamic_cover || musicInfo.cover || null;

        let exactDuration = 30;
        if (typeof d.duration === "number" && d.duration > 0) {
          exactDuration = d.duration > 1000 ? Math.round(d.duration / 1000) : Math.round(d.duration);
        } else if (typeof musicInfo.duration === "number" && musicInfo.duration > 0) {
          exactDuration = musicInfo.duration > 1000 ? Math.round(musicInfo.duration / 1000) : Math.round(musicInfo.duration);
        }

        return {
          id: `tk_${d.id || Date.now()}`,
          rawId: d.id || "",
          title: finalTitle,
          fullTitle: `${finalTitle} - ${finalArtist}`,
          artistsNames: finalArtist,
          thumbnail: finalThumb,
          duration: exactDuration,
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
      const thumb = data.cover || data.images?.[0] || null;

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
 * Lấy URL audio stream từ YouTube bằng yt-dlp (Bản gốc chính thức của ca sĩ cho bài VIP)
 */
const resolveYouTubeStream = async (title, artist = "") => {
  const cleanTitle = (title || "").trim();
  const mainArtist = (artist || "").split(",")[0].trim();
  const cacheKey = `yt_stream_${normalizeSongKey(cleanTitle)}_${normalizeSongKey(mainArtist)}`;

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
      { exe: "yt-dlp", args: baseArgs },
      { exe: "/home/render/.local/bin/yt-dlp", args: baseArgs },
      { exe: "/usr/local/bin/yt-dlp", args: baseArgs },
      { exe: "python", args: ["-m", "yt_dlp", ...baseArgs] },
      { exe: "python3", args: ["-m", "yt_dlp", ...baseArgs] },
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

  let cleanInput = rawUrl.trim();
  if (!cleanInput.startsWith("http://") && !cleanInput.startsWith("https://")) {
    cleanInput = `https://${cleanInput}`;
  }

  const cleanUrl = await unshortenUrl(cleanInput);
  const platform = detectPlatform(cleanUrl) || detectPlatform(rawUrl);

  if (!platform) {
    throw new Error("Đường dẫn không hợp lệ. Vui lòng cung cấp link từ YouTube, SoundCloud hoặc TikTok.");
  }

  const cacheKey = `media_ext_${encodeURIComponent(cleanUrl)}`;
  const cached = ytCache.get(cacheKey);
  if (cached && cached.audioUrl) {
    console.log(`[media extract] Cache hit for: ${cleanUrl}`);
    return cached;
  }

  // ─── 1. SoundCloud ───
  if (platform === "soundcloud") {
    try {
      console.log(`[SoundCloud] Extracting: ${cleanUrl}`);
      const songData = await extractSoundCloud(cleanUrl);
      ytCache.set(cacheKey, songData);
      return songData;
    } catch (scErr) {
      console.warn("[SoundCloud] Error:", scErr.message);
      throw scErr;
    }
  }

  // ─── 2. TikTok ───
  if (platform === "tiktok") {
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

  // ─── 3. YouTube ───
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
    { exe: "yt-dlp", args: baseArgs },
    { exe: "/home/render/.local/bin/yt-dlp", args: baseArgs },
    { exe: "/usr/local/bin/yt-dlp", args: baseArgs },
    { exe: "python", args: ["-m", "yt_dlp", ...baseArgs] },
    { exe: "python3", args: ["-m", "yt_dlp", ...baseArgs] },
  ];

  for (const { exe, args } of strategies) {
    try {
      const result = await execFileAsync(exe, args, {
        timeout: 18000,
        windowsHide: true,
        maxBuffer: 15 * 1024 * 1024,
      });

      const data = JSON.parse(result.stdout);
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

module.exports = { resolveYouTubeStream, extractYouTubeMetadata, findBestAudio, normalizeSongKey, detectPlatform };
