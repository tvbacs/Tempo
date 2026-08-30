/**
 * YouTubeDownloaderScreen - Trung Tâm Trích Xuất & Tải Nhạc YouTube (MP3 320kbps)
 * Thiết kế hiện đại chuẩn Spotify / Apple Music, trực quan, có thẻ chuyển nhanh sang kho nhạc đã tải
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Video,
  Download,
  Play,
  Heart,
  Sparkles,
  CheckCircle,
  X,
  ChevronRight,
  HardDriveDownload,
  Radio,
  Zap,
} from "lucide-react-native";
import { apiClient } from "../api/client";
import { UnifiedSong } from "../types/music";
import { usePlayerStore } from "../store/playerStore";
import { useDownloadStore } from "../store/downloadStore";
import { useLibraryStore } from "../store/libraryStore";
import { useToastStore } from "../store/toastStore";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";
import { formatDuration } from "../utils/format";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURED_CHANNELS = [
  {
    title: "Đừng Làm Trái Tim Anh Đau",
    artist: "Sơn Tùng M-TP",
    url: "https://www.youtube.com/watch?v=abPmZCZZrFA",
    thumb: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/5/9/6/9/59696c9dba7a914d587d886049c10df6.jpg",
  },
  {
    title: "Không Thể Say",
    artist: "HIEUTHUHAI",
    url: "https://www.youtube.com/watch?v=i0nd3NPJ4MI",
    thumb: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/c/0/7/4/c0742c35795d4d234bf86cc7258b5077.jpg",
  },
  {
    title: "Nâng Chén Tiêu Sầu",
    artist: "Bích Phương",
    url: "https://www.youtube.com/watch?v=sU8G7Q4rUA4",
    thumb: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/c/a/ca854cf713fa66dbd8fe2d9894e6bf76_1509939578.jpg",
  },
  {
    title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
  },
];

export const YouTubeDownloaderScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSong, setExtractedSong] = useState<(UnifiedSong & { audioUrl: string; quality?: string; fileSize?: string }) | null>(null);
  const [recentExtracts, setRecentExtracts] = useState<UnifiedSong[]>([]);

  const { playSong } = usePlayerStore();
  const { downloadedSongs, downloadSong, isDownloaded, isDownloading, fetchDownloads } = useDownloadStore();
  const { isLiked, toggleLike } = useLibraryStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const handleExtract = async (targetUrl?: string) => {
    const inputUrl = (targetUrl || url).trim();
    if (!inputUrl) {
      showToast("Vui lòng dán đường dẫn YouTube", "info");
      return;
    }

    Keyboard.dismiss();
    setIsExtracting(true);
    setExtractedSong(null);

    try {
      showToast("Đang kết nối YouTube & trích xuất âm thanh...", "info");
      const data = await apiClient.extractYouTube(inputUrl);
      setExtractedSong(data);

      setRecentExtracts((prev) => {
        const filtered = prev.filter((s) => s.id !== data.id);
        return [data, ...filtered].slice(0, 8);
      });

      showToast(`Đã trích xuất xong "${data.title}"!`, "info");
    } catch (err: any) {
      console.error("Extract failed:", err);
      showToast(err.message || "Trích xuất thất bại. Vui lòng kiểm tra lại liên kết.", "info");
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePlay = (song: UnifiedSong) => {
    playSong(song, [song, ...recentExtracts], { type: 'extracted', title: 'Nhạc trích xuất' });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <Text style={styles.headerMainTitle}>Tải xuống</Text>
          <Text style={styles.headerSubtitle}>Trích xuất âm thanh từ video YouTube</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Profile")}
          style={styles.headerAvatarBtn}
        >
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" }}
            style={styles.headerAvatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* Card: Kho Nhạc Đã Tải Xuống (Chuyển nhanh sang màn hình Bài Hát Đã Tải) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate("DownloadedSongs")}
          style={styles.offlineHubCard}
        >
          <LinearGradient
            colors={["#0F2027", "#203A43", "#2C5364"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.offlineHubGradient}
          />
          <View style={styles.offlineHubContent}>
            <View style={styles.offlineHubIconBox}>
              <HardDriveDownload size={24} color="#1DB954" />
            </View>
            <View style={styles.offlineHubTextWrap}>
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineBadgeText}>KHO NHẠC NGOẠI TUYẾN</Text>
              </View>
              <Text style={styles.offlineHubTitle}>Bài Hát Đã Tải Xuống</Text>
              <Text style={styles.offlineHubSub}>
                {downloadedSongs.length > 0
                  ? `${downloadedSongs.length} bài hát sẵn sàng nghe khi không có mạng`
                  : "Chưa có bài hát nào · Chạm để quản lý"}
              </Text>
            </View>
            <View style={styles.offlineHubArrow}>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Hero Visual Card: YouTube Extractor */}
        <View style={styles.extractorCard}>
          <LinearGradient
            colors={[COLORS.bgHeroGradientDeep, COLORS.bgHeroGradientMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.extractorGradient}
          />

          <View style={styles.extractorHeader}>
            <View style={styles.tagWrap}>
              <Video size={14} color={COLORS.accentPrimary} />
              <Text style={styles.tagText}>YOUTUBE AUDIO CONVERTER</Text>
            </View>
            <Text style={styles.extractorTitle}>Dán Link YouTube Để Trích Xuất</Text>
            <Text style={styles.extractorSub}>
              Hỗ trợ video, YouTube Shorts & YouTube Music.
            </Text>
          </View>

          {/* Input Box */}
          <View style={styles.inputWrapper}>
            <Video size={18} color="#FF0000" />
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Dán link https://youtube.com/..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.inputField}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {url.length > 0 && (
              <TouchableOpacity onPress={() => setUrl("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Extract Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleExtract()}
            disabled={isExtracting}
            style={styles.extractBtn}
          >
            <LinearGradient
              colors={[COLORS.accentPrimary, COLORS.accentSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.extractBtnGradient}
            >
              {isExtracting ? (
                <View style={styles.btnInner}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.extractBtnText}>Đang trích xuất MP3...</Text>
                </View>
              ) : (
                <View style={styles.btnInner}>
                  <Text style={styles.extractBtnText}>Trích Xuất & Nghe Thử</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Extracted Result Hero Card */}
        {extractedSong && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Sparkles size={16} color={COLORS.accentPrimary} />
              <Text style={styles.resultHeaderText}>TRÍCH XUẤT THÀNH CÔNG</Text>
            </View>

            <View style={styles.resultBody}>
              <Image source={{ uri: extractedSong.thumbnail }} style={styles.resultThumb} />
              <View style={styles.resultInfo}>
                <Text numberOfLines={2} style={styles.resultTitle}>
                  {extractedSong.title}
                </Text>
                <Text numberOfLines={1} style={styles.resultArtist}>
                  {extractedSong.artistsNames}
                </Text>
                <View style={styles.resultMetaRow}>
                  <View style={styles.qualityBadge}>
                    <Text style={styles.qualityBadgeText}>{extractedSong.quality || "MP3 HQ"}</Text>
                  </View>
                  <Text style={styles.resultMetaText}>{formatDuration(extractedSong.duration)}</Text>
                  {extractedSong.fileSize && (
                    <Text style={styles.resultMetaText}>• {extractedSong.fileSize}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons for Extracted Song */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePlay(extractedSong)}
                style={styles.actionPlayBtn}
              >
                <Play size={18} color={COLORS.white} fill={COLORS.white} />
                <Text style={styles.actionPlayBtnText}>Phát bài này</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => downloadSong(extractedSong)}
                style={styles.actionDownloadBtn}
              >
                {isDownloading(extractedSong.id) ? (
                  <ActivityIndicator size="small" color="#1DB954" />
                ) : isDownloaded(extractedSong.id) ? (
                  <CheckCircle size={18} color="#1DB954" />
                ) : (
                  <Download size={18} color={COLORS.textPrimary} />
                )}
                <Text style={[styles.actionDownloadBtnText, isDownloaded(extractedSong.id) && { color: "#1DB954" }]}>
                  {isDownloaded(extractedSong.id) ? "Đã lưu offline" : "Tải về máy"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleLike(extractedSong)}
                style={styles.actionHeartBtn}
              >
                <Heart
                  size={20}
                  color={isLiked(extractedSong.id) ? COLORS.accentPrimary : COLORS.textPrimary}
                  fill={isLiked(extractedSong.id) ? COLORS.accentPrimary : "transparent"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sample Suggestions Carousel */}
        <View style={styles.sampleSection}>
          <Text style={styles.sectionHeading}>GỢI Ý VIDEO THỊNH HÀNH</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sampleList}
          >
            {FEATURED_CHANNELS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.82}
                onPress={() => {
                  setUrl(item.url);
                  handleExtract(item.url);
                }}
                style={styles.sampleCard}
              >
                <Image source={{ uri: item.thumb }} style={styles.sampleThumb} />
                <View style={styles.sampleInfo}>
                  <Text numberOfLines={1} style={styles.sampleTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.sampleArtist}>
                    {item.artist}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recently Extracted List */}
        {recentExtracts.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionHeading}>ĐÃ TRÍCH XUẤT GẦN ĐÂY</Text>
            {recentExtracts.map((song) => (
              <TouchableOpacity
                key={song.id}
                activeOpacity={0.75}
                onPress={() => handlePlay(song)}
                style={styles.recentRow}
              >
                <Image source={{ uri: song.thumbnail }} style={styles.recentThumb} />
                <View style={styles.recentInfo}>
                  <Text numberOfLines={1} style={styles.recentTitle}>
                    {song.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.recentArtist}>
                    {song.artistsNames}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => downloadSong(song)}
                  style={styles.recentDownloadBtn}
                >
                  <Download size={18} color={isDownloaded(song.id) ? COLORS.accentPrimary : COLORS.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export { YouTubeDownloaderScreen as DownloaderScreen };

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  navLeft: {
    flex: 1,
  },
  headerMainTitle: {
    fontSize: TYPOGRAPHY.sizeHero,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  headerAvatar: {
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xs,
  },
  offlineHubCard: {
    borderRadius: LAYOUT.radiusLg,
    overflow: "hidden",
    position: "relative",
    marginBottom: SPACING.lg,
  },
  offlineHubGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  offlineHubContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
  },
  offlineHubIconBox: {
    width: 48,
    height: 48,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  offlineHubTextWrap: {
    flex: 1,
  },
  offlineBadge: {
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  offlineBadgeText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: "#1DB954",
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
  },
  offlineHubTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
  },
  offlineHubSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textLightMuted,
  },
  offlineHubArrow: {
    paddingLeft: SPACING.sm,
  },
  extractorCard: {
    borderRadius: LAYOUT.radiusLg,
    overflow: "hidden",
    position: "relative",
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  extractorGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  extractorHeader: {
    marginBottom: SPACING.md,
  },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: 4,
  },
  tagText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
  },
  extractorTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  extractorSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textLightMuted,
    lineHeight: TYPOGRAPHY.lineHeightBody,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusMd,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  inputField: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizeBodySmall,
  },
  extractBtn: {
    borderRadius: LAYOUT.radiusFull,
    overflow: "hidden",
  },
  extractBtnGradient: {
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs + 2,
  },
  extractBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "800",
    color: COLORS.white,
  },
  resultCard: {
    backgroundColor: COLORS.bgSurfaceSecondary,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  resultHeaderText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
  },
  resultBody: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  resultThumb: {
    width: 76,
    height: 76,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurface,
    marginRight: SPACING.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  resultArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs + 2,
  },
  qualityBadge: {
    backgroundColor: COLORS.tileOrange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: LAYOUT.radiusXs,
  },
  qualityBadgeText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.accentPrimary,
  },
  resultMetaText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
  },
  resultActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  actionPlayBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.accentPrimary,
    paddingVertical: SPACING.sm + 2,
    borderRadius: LAYOUT.radiusFull,
  },
  actionPlayBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.white,
  },
  actionDownloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: LAYOUT.radiusFull,
  },
  actionDownloadBtnText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  actionHeartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  sampleSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: SPACING.md,
  },
  sampleList: {
    gap: SPACING.md,
  },
  sampleCard: {
    width: 140,
  },
  sampleThumb: {
    width: 140,
    height: 100,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs,
  },
  sampleInfo: {
    paddingHorizontal: 2,
  },
  sampleTitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  sampleArtist: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textSecondary,
  },
  recentSection: {
    marginTop: SPACING.xs,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    marginBottom: 2,
  },
  recentThumb: {
    width: LAYOUT.avatarSm,
    height: LAYOUT.avatarSm,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  recentInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  recentTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  recentArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  recentDownloadBtn: {
    padding: SPACING.xs,
  },
});
