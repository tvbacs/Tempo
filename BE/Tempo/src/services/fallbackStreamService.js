/**
 * Smart Fallback Audio Stream Resolver
 * Thứ tự ưu tiên mở khóa VIP:
 * 1. Zing MP3 (Nếu là bài miễn phí)
 * 2. YouTube Official Master Track (Bản gốc chính thức của ca sĩ qua yt-dlp)
 * 3. Audius (Kho nhạc quốc tế chất lượng 320kbps)
 * 4. Zing MP3 Alternative (Chỉ chọn bản gốc, loại bỏ hoàn toàn Remix/Cover/Lofi/Amateur)
 */
const { ZingMp3 } = require("zingmp3-api-full");
const zingService = require("./zingService");
const audiusService = require("./audiusService");
const { resolveYouTubeStream } = require("./ytDlpService");

const resolveAudioStream = async (songId, title = "", artist = "") => {
  const isAudius = songId.startsWith("audius_");

  // 1. Audius tracks - phát thẳng
  if (isAudius) {
    const rawId = songId.replace("audius_", "");
    return {
      audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${rawId}/stream?app_name=TEMPO_MUSIC_APP`,
      quality: "320kbps",
      isFallback: false,
    };
  }

  // 2. Zing MP3 track - thử stream trực tiếp bản gốc nếu miễn phí
  const rawId = songId.replace("zing_", "");
  try {
    const res = await ZingMp3.getSong(rawId);
    if (res.err === 0 && res.data) {
      let audioUrl =
        res.data["128"] ||
        (res.data["320"] && res.data["320"] !== "VIP"
          ? res.data["320"]
          : null);
      if (audioUrl) {
        if (audioUrl.startsWith("http://"))
          audioUrl = audioUrl.replace("http://", "https://");
        return { audioUrl, quality: "128kbps", isFallback: false };
      }
    }
  } catch (err) {
    console.warn(
      `[Zing] Bài hát ${rawId} bị giới hạn VIP (${err.message}), kích hoạt tìm kiếm bản gốc...`
    );
  }

  // Lấy metadata tên bài và nghệ sĩ
  let songTitle = title;
  let songArtist = artist;
  if (!songTitle) {
    try {
      const songInfo = await ZingMp3.getInfo(rawId);
      if (songInfo?.data) {
        songTitle = songInfo.data.title || "";
        songArtist = songInfo.data.artistsNames || "";
      }
    } catch (_) {}
  }

  console.log(
    `[Fallback VIP] Tìm kiếm bản gốc chuẩn cho bài VIP: "${songTitle}" - "${songArtist}"`
  );

  // 3. ƯU TIÊN 1: YouTube Official Audio / Music Video của chính chủ nghệ sĩ
  if (songTitle) {
    try {
      const ytResult = await resolveYouTubeStream(songTitle, songArtist);
      if (ytResult?.audioUrl) {
        console.log(`[Fallback YouTube] OK - Đã lấy được bản gốc chính thức từ YouTube cho "${songTitle}"`);
        return ytResult;
      }
    } catch (ytErr) {
      console.warn("[Fallback YouTube] Lỗi:", ytErr.message);
    }
  }

  // 4. ƯU TIÊN 2: Kho nhạc quốc tế Audius 320kbps
  if (songTitle) {
    try {
      const query = `${songTitle} ${songArtist}`.trim();
      const audiusResults = await audiusService.search(query, 3);
      if (audiusResults?.songs?.length > 0) {
        const best = audiusResults.songs[0];
        return {
          audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${best.rawId}/stream?app_name=TEMPO_MUSIC_APP`,
          quality: "320kbps",
          isFallback: true,
          fallbackSource: "audius",
          message: `Đang phát qua Audius (${best.artistsNames})`,
        };
      }
    } catch (fallbackErr) {
      console.warn("[Fallback Audius] Lỗi:", fallbackErr.message);
    }
  }

  // 5. ƯU TIÊN 3: Bản thay thế trên Zing MP3 (Chỉ chọn bản chuẩn, LỌC BỎ triệt để Remix/Cover/Lofi/Karaoke)
  if (songTitle) {
    try {
      const searchRes = await zingService.search(songTitle);
      if (searchRes?.songs) {
        const unwantedKeywords = ["remix", "cover", "lofi", "karaoke", "sped up", "speed up", "slowed", "parody", "nhạc sống", "beat"];
        const origHasKeyword = (kw) => songTitle.toLowerCase().includes(kw);

        for (const altSong of searchRes.songs) {
          if (altSong.rawId !== rawId && !altSong.isVip) {
            const altTitleLower = (altSong.title || "").toLowerCase();
            // Bỏ qua nếu là bản phối/remix/cover mà bài gốc không có
            const isUnwanted = unwantedKeywords.some(kw => !origHasKeyword(kw) && altTitleLower.includes(kw));
            if (isUnwanted) continue;

            try {
              const stream = await zingService.getSongStream(altSong.rawId);
              if (stream?.audioUrl) {
                console.log(`[Zing Alt] OK - Tìm thấy bản chuẩn cho "${songTitle}" (${altSong.artistsNames})`);
                return {
                  audioUrl: stream.audioUrl,
                  quality: "128kbps",
                  isFallback: true,
                  fallbackSource: "zing_alt",
                  message: `Đang phát bản chuẩn thay thế (${altSong.artistsNames})`,
                };
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {}
  }

  throw new Error(
    "Bài hát này yêu cầu tài khoản VIP và không thể tìm thấy luồng phát phù hợp"
  );
};

module.exports = { resolveAudioStream };
