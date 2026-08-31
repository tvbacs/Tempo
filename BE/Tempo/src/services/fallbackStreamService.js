/**
 * Smart Fallback Audio Stream Resolver (Production-Grade Match Scoring)
 *
 * Thứ tự ưu tiên giải mã:
 * 1. Zing MP3 Direct (Nếu bài hát miễn phí)
 * 2. YouTube Official Audio / MV (Bản thu âm chính thức từ kênh ca sĩ qua yt-dlp)
 * 3. Audius Stream (Kho nhạc quốc tế chất lượng cao 320kbps với bộ lọc Match Score)
 * 4. Zing MP3 Alternative (Bản chuẩn dự phòng cùng ca sĩ, loại bỏ hoàn toàn Remix/Cover)
 */
const { ZingMp3 } = require("zingmp3-api-full");
const zingService = require("./zingService");
const audiusService = require("./audiusService");
const { resolveYouTubeStream } = require("./ytDlpService");

/**
 * Chuẩn hóa chuỗi văn bản loại bỏ dấu tiếng Việt và ký tự đặc biệt
 */
function normalizeText(str = "") {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Chấm điểm độ tương đồng giữa bài hát ứng viên và bài hát mục tiêu
 * @returns {{ score: number, isMatch: boolean }}
 */
function calculateMatchScore(candidateTitle, candidateArtist, targetTitle, targetArtist) {
  const normCandTitle = normalizeText(candidateTitle);
  const normCandArtist = normalizeText(candidateArtist);
  const normTgtTitle = normalizeText(targetTitle);
  const normTgtArtist = normalizeText(targetArtist);

  if (!normCandTitle || !normTgtTitle) return { score: 0, isMatch: false };

  let score = 0;

  // 1. Chấm điểm Tiêu đề (Tối đa 60 điểm)
  if (normCandTitle === normTgtTitle) {
    score += 60;
  } else if (normCandTitle.includes(normTgtTitle) || normTgtTitle.includes(normCandTitle)) {
    score += 40;
  } else {
    // Kiểm tra độ trùng lặp từ khóa chính
    const tgtWords = normTgtTitle.split(" ").filter((w) => w.length > 1);
    const matchedWords = tgtWords.filter((w) => normCandTitle.includes(w));
    if (tgtWords.length > 0 && matchedWords.length / tgtWords.length >= 0.7) {
      score += 30;
    }
  }

  // 2. Chấm điểm Nghệ sĩ / Ca sĩ (Tối đa 40 điểm)
  if (normTgtArtist) {
    const mainTgtArtist = normTgtArtist.split(" ")[0]; // Tên chính
    if (normCandArtist === normTgtArtist) {
      score += 40;
    } else if (normCandArtist.includes(normTgtArtist) || normTgtArtist.includes(normCandArtist)) {
      score += 35;
    } else if (mainTgtArtist && normCandArtist.includes(mainTgtArtist)) {
      score += 25;
    }
  } else {
    score += 20; // Nếu không có thông tin nghệ sĩ mục tiêu
  }

  // 3. Phạt điểm nặng nếu ứng viên là bản Remix/Cover/Lofi mà bài gốc không yêu cầu (-50 điểm)
  const unwantedKeywords = [
    "remix",
    "cover",
    "lofi",
    "karaoke",
    "sped up",
    "speed up",
    "slowed",
    "parody",
    "nhac song",
    "beat",
    "mashup",
    "instrumental",
    "acoustic cover",
  ];

  const origHasKeyword = (kw) => normTgtTitle.includes(kw);
  const candHasUnwanted = unwantedKeywords.some(
    (kw) => !origHasKeyword(kw) && normCandTitle.includes(kw)
  );

  if (candHasUnwanted) {
    score -= 50;
  }

  return {
    score,
    isMatch: score >= 55,
  };
}

/**
 * Tìm bài hát khớp nhất từ danh sách ứng viên dựa trên Match Score
 */
function findBestCandidate(candidates, targetTitle, targetArtist) {
  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return null;

  const scored = candidates
    .map((item) => {
      const title = item.title || "";
      const artist = item.artistsNames || item.artist || item.uploader || "";
      const { score, isMatch } = calculateMatchScore(title, artist, targetTitle, targetArtist);
      return { item, score, isMatch };
    })
    .filter((entry) => entry.isMatch)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].item : null;
}

/**
 * Resolver chính điều phối luồng phát nhạc thông minh
 */
const resolveAudioStream = async (songId, title = "", artist = "") => {
  const isAudius = songId.startsWith("audius_");

  // ─── 1. Audius track ID trực tiếp ───
  if (isAudius) {
    const rawId = songId.replace("audius_", "");
    return {
      audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${rawId}/stream?app_name=TEMPO_MUSIC_APP`,
      quality: "320kbps",
      isFallback: false,
      fallbackSource: "audius",
    };
  }

  // ─── 2. Zing MP3 Track: Thử phát trực tiếp nếu là bài miễn phí ───
  const rawId = songId.replace("zing_", "");
  try {
    const res = await ZingMp3.getSong(rawId);
    if (res.err === 0 && res.data) {
      let audioUrl =
        res.data["128"] ||
        (res.data["320"] && res.data["320"] !== "VIP" ? res.data["320"] : null);
      if (audioUrl) {
        if (audioUrl.startsWith("http://")) {
          audioUrl = audioUrl.replace("http://", "https://");
        }
        return {
          audioUrl,
          quality: "128kbps",
          isFallback: false,
          fallbackSource: "zing_direct",
        };
      }
    }
  } catch (err) {
    console.warn(`[Zing] Bài hát ${rawId} bị giới hạn VIP (${err.message}), kích hoạt Smart Fallback...`);
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

  console.log(`[Smart Fallback] Tìm kiếm bản gốc chuẩn cho: "${songTitle}" - "${songArtist}"`);

  // ─── 3. ƯU TIÊN 1: YouTube Official Audio / MV (Bản thu âm chính thức từ ca sĩ qua yt-dlp) ───
  if (songTitle) {
    try {
      const ytResult = await resolveYouTubeStream(songTitle, songArtist);
      if (ytResult?.audioUrl) {
        console.log(`[Fallback YouTube] OK - Đã lấy được bản gốc chính thức từ YouTube cho "${songTitle}"`);
        return {
          ...ytResult,
          fallbackSource: "youtube",
        };
      }
    } catch (ytErr) {
      console.warn("[Fallback YouTube] Lỗi:", ytErr.message);
    }
  }

  // ─── 4. ƯU TIÊN 2: Kho nhạc quốc tế Audius (Chấm điểm Match Score >= 55) ───
  if (songTitle) {
    try {
      const query = `${songTitle} ${songArtist}`.trim();
      const audiusResults = await audiusService.search(query, 5);
      if (audiusResults?.songs?.length > 0) {
        const bestSong = findBestCandidate(audiusResults.songs, songTitle, songArtist);
        if (bestSong) {
          console.log(`[Fallback Audius] OK - Khớp bài "${bestSong.title}" (${bestSong.artistsNames})`);
          return {
            audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${bestSong.rawId}/stream?app_name=TEMPO_MUSIC_APP`,
            quality: "320kbps",
            isFallback: true,
            fallbackSource: "audius",
            title: bestSong.title,
            artistsNames: bestSong.artistsNames,
            message: `Đang phát qua Audius (${bestSong.artistsNames})`,
          };
        }
      }
    } catch (fallbackErr) {
      console.warn("[Fallback Audius] Lỗi:", fallbackErr.message);
    }
  }

  // ─── 5. ƯU TIÊN 3: Zing MP3 Alternative (Tìm kiếm theo Title + Artist & Chấm điểm Match Score) ───
  if (songTitle) {
    try {
      const searchQuery = `${songTitle} ${songArtist}`.trim();
      const searchRes = await zingService.search(searchQuery);
      if (searchRes?.songs?.length > 0) {
        // Lọc các bài không phải VIP và khác rawId hiện tại
        const eligibleSongs = searchRes.songs.filter((s) => s.rawId !== rawId && !s.isVip);
        const bestAltSong = findBestCandidate(eligibleSongs, songTitle, songArtist);

        if (bestAltSong) {
          try {
            const stream = await zingService.getSongStream(bestAltSong.rawId);
            if (stream?.audioUrl) {
              console.log(`[Zing Alt] OK - Tìm thấy bản chuẩn cho "${bestAltSong.title}" (${bestAltSong.artistsNames})`);
              return {
                audioUrl: stream.audioUrl,
                quality: "128kbps",
                isFallback: true,
                fallbackSource: "zing_alt",
                title: bestAltSong.title,
                artistsNames: bestAltSong.artistsNames,
                message: `Đang phát bản chuẩn thay thế (${bestAltSong.artistsNames})`,
              };
            }
          } catch (_) {}
        }
      }
    } catch (e) {}
  }

  throw new Error("Bài hát này yêu cầu tài khoản VIP và không thể tìm thấy luồng phát phù hợp");
};

module.exports = {
  resolveAudioStream,
  calculateMatchScore,
  findBestCandidate,
  normalizeText,
};
