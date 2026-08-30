/**
 * Smart Fallback Audio Stream Resolver
 * Thứ tự ưu tiên:
 * 1. Zing MP3 (Nếu là bài miễn phí)
 * 2. YouTube Official Audio (Bản gốc chính thức của ca sĩ qua yt-dlp)
 * 3. Audius (Kho nhạc quốc tế)
 * 4. Zing MP3 Alternative (Bản dự phòng cuối cùng)
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
    `[Fallback] Tìm bản gốc cho bài VIP: "${songTitle}" - "${songArtist}"`
  );

  // 3. ƯU TIÊN HÀNG ĐẦU: YouTube via yt-dlp để lấy đúng BẢN GỐC CHÍNH THỨC của ca sĩ
  if (songTitle) {
    try {
      const ytResult = await resolveYouTubeStream(songTitle, songArtist);
      if (ytResult?.audioUrl) {
        return ytResult;
      }
    } catch (ytErr) {
      console.warn("[Fallback YouTube] Lỗi:", ytErr.message);
    }
  }

  // 4. ƯU TIÊN 2: Audius
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

  // 5. Dự phòng cuối: Tìm bản thay thế trên Zing
  if (songTitle) {
    try {
      const searchRes = await zingService.search(songTitle);
      if (searchRes?.songs) {
        for (const altSong of searchRes.songs) {
          if (altSong.rawId !== rawId && !altSong.isVip) {
            try {
              const stream = await zingService.getSongStream(altSong.rawId);
              if (stream?.audioUrl) {
                return {
                  audioUrl: stream.audioUrl,
                  quality: "128kbps",
                  isFallback: true,
                  fallbackSource: "zing_alt",
                  message: `Đang phát bản thay thế (${altSong.artistsNames})`,
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
