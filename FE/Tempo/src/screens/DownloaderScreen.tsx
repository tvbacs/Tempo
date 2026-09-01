/**
 * DownloaderScreen - Trung Tâm Trích Xuất & Tải Nhạc Đa Nền Tảng (YouTube, SoundCloud, TikTok)
 * Thiết kế chuẩn Spotify / Apple Music, 100% Tokenized, Zero Borders, No Emojis
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
  Music,
  ListPlus,
  Plus,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiClient } from "../api/client";
import { UnifiedSong } from "../types/music";
import { AddToPlaylistModal } from "../components/AddToPlaylistModal";
import { usePlayerStore } from "../store/playerStore";
import { useDownloadStore } from "../store/downloadStore";
import { useLibraryStore } from "../store/libraryStore";
import { useToastStore } from "../store/toastStore";
import { useAuthStore } from "../store/authStore";
import { useNavStore } from "../store/navStore";
import { AppAvatarBadge } from "../components/AppAvatarBadge";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";
import { formatDuration } from "../utils/format";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURED_CHANNELS = [
  {
    title: "Đừng Làm Trái Tim Anh Đau",
    artist: "Sơn Tùng M-TP",
    url: "https://www.youtube.com/watch?v=abPmZCZZrFA",
    thumb: "https://i.ytimg.com/vi/abPmZCZZrFA/hqdefault.jpg",
  },
  {
    title: "Không Thể Say",
    artist: "HIEUTHUHAI",
    url: "https://www.youtube.com/watch?v=i0nd3NPJ4MI",
    thumb: "https://i.ytimg.com/vi/i0nd3NPJ4MI/hqdefault.jpg",
  },
  {
    title: "Nâng Chén Tiêu Sầu",
    artist: "Bích Phương",
    url: "https://www.youtube.com/watch?v=sU8G7Q4rUA4",
    thumb: "https://i.ytimg.com/vi/sU8G7Q4rUA4/hqdefault.jpg",
  },
  {
    title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumb: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  },
];

export const DownloaderScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useFocusEffect(
    React.useCallback(() => {
      useNavStore.getState().setCurrentRoute("Downloads");
    }, [])
  );
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSong, setExtractedSong] = useState<(UnifiedSong & { audioUrl: string; quality?: string; fileSize?: string }) | null>(null);
  const [searchResults, setSearchResults] = useState<UnifiedSong[]>([]);
  const [recentExtracts, setRecentExtracts] = useState<UnifiedSong[]>([]);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<UnifiedSong | null>(null);

  const { playSong } = usePlayerStore();
  const { downloadedSongs, downloadSong, isDownloaded, isDownloading, fetchDownloads } = useDownloadStore();
  const { isLiked, toggleLike } = useLibraryStore();
  const { showToast } = useToastStore();
  const { user, canExtract, incrementExtractCount, getRemainingExtracts } = useAuthStore();

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const handleExtract = async (targetUrl?: string) => {
    const inputStr = (targetUrl || url).trim();
    if (!inputStr) {
      showToast("Vui lòng nhập tên bài hát hoặc dán đường dẫn", "info");
      return;
    }

    const isUrl = inputStr.startsWith('http://') || inputStr.startsWith('https://') || inputStr.includes('youtu.be') || inputStr.includes('youtube.com') || inputStr.includes('tiktok.com') || inputStr.includes('soundcloud.com');

    Keyboard.dismiss();
    setIsExtracting(true);
    setExtractedSong(null);
    setSearchResults([]);

    // Nếu người dùng nhập tên bài hát (không phải URL) -> Tìm kiếm bài hát
    if (!isUrl) {
      try {
        showToast(`Đang tìm kiếm "${inputStr}"...`, "info");
        const searchData = await apiClient.search(inputStr);
        if (searchData && searchData.songs && searchData.songs.length > 0) {
          setSearchResults(searchData.songs);
          showToast(`Tìm thấy ${searchData.songs.length} bài hát!`, "success");
          setIsExtracting(false);
          return;
        }
      } catch (_) {}
    }

    // Kiểm tra giới hạn 5 lần cho tài khoản Free khi trích xuất link
    if (!canExtract()) {
      showToast("Bạn đã dùng hết 5 lượt trích xuất Free. Nâng cấp VIP để trích xuất không giới hạn!", "vip");
      navigation.navigate("UpgradeScreen");
      setIsExtracting(false);
      return;
    }

    try {
      showToast("Đang kết nối & trích xuất âm thanh...", "info");
      const data = await apiClient.extractYouTube(inputStr);
      setExtractedSong(data);

      await incrementExtractCount();

      setRecentExtracts((prev) => {
        const filtered = prev.filter((s) => s.id !== data.id);
        return [data, ...filtered].slice(0, 8);
      });

      showToast(`Đã trích xuất xong "${data.title}"!`, "success");
    } catch (err: any) {
      console.warn("Extract error handled:", err.message);
      showToast(err.message || "Không thể tìm hoặc trích xuất bài hát này.", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePlay = (song: UnifiedSong) => {
    const activeQueue = searchResults.length > 0
      ? searchResults
      : recentExtracts.length > 0
      ? recentExtracts
      : [song];
    playSong(song, activeQueue, { type: 'extracted', title: 'Nhạc trích xuất' });
  };

  const remaining = getRemainingExtracts();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <Text style={styles.headerMainTitle}>Tải xuống</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Profile")}
          style={styles.headerAvatarBtn}
        >
          <AppAvatarBadge size={42} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.sampleSection}>
          <Text style={styles.sectionHeading}>GỢI Ý THỊNH HÀNH</Text>
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

        <View style={styles.extractorCard}>
          <LinearGradient
            colors={["#0A0A0E", "#1C0E14", "#3D141E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.extractorGradient}
          />

          <View style={styles.extractorHeader}>
            <View style={styles.tagWrap}>
              <Music size={14} color={COLORS.accentPrimary} />
              <Text style={styles.tagText}>UNIVERSAL MUSIC DOWNLOADER</Text>
            </View>
            <Text style={styles.extractorTitle}>Tải Nhạc Trực Tiếp & Trích Xuất</Text>
            <Text style={styles.extractorSub}>
              Có thể nghe & thêm vào Yêu thích / Danh sách phát mà không cần tải xuống, hoặc lưu về máy để nghe Offline.
            </Text>
            <View style={styles.quotaBadge}>
              <Text style={styles.quotaBadgeText}>
                {user?.isVip
                  ? "VIP: Tải & Trích xuất không giới hạn"
                  : `Trích xuất link Free: Còn lại ${remaining} / 5 lượt`}
              </Text>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Music size={18} color={COLORS.accentPrimary} />
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Nhập tên bài hát hoặc dán link..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.inputField}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => handleExtract()}
            />
            {url.length > 0 && (
              <TouchableOpacity onPress={() => { setUrl(""); setSearchResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

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
                  <Text style={styles.extractBtnText}>Đang xử lý...</Text>
                </View>
              ) : (
                <View style={styles.btnInner}>
                  <Text style={styles.extractBtnText}>Trích xuất</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Danh sách kết quả tìm kiếm bài hát theo tên */}
        {searchResults.length > 0 && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderText}>KẾT QUẢ TÌM KIẾM ({searchResults.length})</Text>
            </View>

            {searchResults.map((song) => {
              const downloading = isDownloading(song.id);
              const downloaded = isDownloaded(song.id);
              const liked = isLiked(song.id);

              return (
                <View key={song.id} style={[styles.resultBody, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12, marginBottom: 12 }]}>
                  <Image source={{ uri: song.thumbnail }} style={styles.resultThumb} />
                  <View style={styles.resultInfo}>
                    <Text numberOfLines={1} style={styles.resultTitle}>
                      {song.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.resultArtist}>
                      {song.artistsNames}
                    </Text>
                    <View style={styles.resultMetaRow}>
                      <View style={styles.qualityBadge}>
                        <Text style={styles.qualityBadgeText}>320k HQ</Text>
                      </View>
                      <Text style={styles.resultMetaText}>{formatDuration(song.duration)}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => playSong(song, searchResults)}
                      style={[styles.actionIconBtnPrimary, { width: 36, height: 36 }]}
                    >
                      <Play size={16} color={COLORS.white} fill={COLORS.white} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => downloadSong(song)}
                      style={[styles.actionIconBtn, { width: 36, height: 36 }]}
                    >
                      {downloading ? (
                        <ActivityIndicator size="small" color="#1DB954" />
                      ) : downloaded ? (
                        <CheckCircle size={18} color="#1DB954" />
                      ) : (
                        <Download size={18} color={COLORS.textPrimary} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedSongForPlaylist(song)}
                      style={[styles.actionIconBtn, { width: 36, height: 36 }]}
                    >
                      <ListPlus size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => toggleLike(song)}
                      style={[styles.actionIconBtn, { width: 36, height: 36 }]}
                    >
                      <Heart
                        size={18}
                        color={liked ? COLORS.accentPrimary : COLORS.textPrimary}
                        fill={liked ? COLORS.accentPrimary : "transparent"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {extractedSong && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
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
                </View>
              </View>
            </View>

            <View style={styles.resultActions}>
              <View style={styles.resultActionsLeft}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePlay(extractedSong)}
                  style={styles.actionIconBtnPrimary}
                >
                  <Play size={20} color={COLORS.white} fill={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => downloadSong(extractedSong)}
                  style={styles.actionIconBtn}
                >
                  {isDownloading(extractedSong.id) ? (
                    <ActivityIndicator size="small" color="#1DB954" />
                  ) : isDownloaded(extractedSong.id) ? (
                    <CheckCircle size={20} color="#1DB954" />
                  ) : (
                    <Download size={20} color={COLORS.textPrimary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedSongForPlaylist(extractedSong)}
                  style={styles.actionIconBtn}
                >
                  <ListPlus size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleLike(extractedSong)}
                  style={styles.actionIconBtn}
                >
                  <Heart
                    size={20}
                    color={isLiked(extractedSong.id) ? COLORS.accentPrimary : COLORS.textPrimary}
                    fill={isLiked(extractedSong.id) ? COLORS.accentPrimary : "transparent"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate("DownloadedSongs")}
          style={styles.offlineHubCard}
        >
          <LinearGradient
            colors={["#141414", "#1E1E1E", "#252525"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.offlineHubGradient}
          />
          <View style={styles.offlineHubContent}>
            <View style={styles.offlineHubIconBox}>
              <HardDriveDownload size={24} color={COLORS.white} />
            </View>
            <View style={styles.offlineHubTextWrap}>
              <Text style={styles.offlineHubTitle}>Bài Hát Đã Tải Xuống</Text>
              <Text style={styles.offlineHubSub}>
                {downloadedSongs.length > 0
                  ? `${downloadedSongs.length} bài hát sẵn sàng nghe khi không có mạng`
                  : "Chưa có bài hát nào"}
              </Text>
            </View>
            <View style={styles.offlineHubArrow}>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </View>
          </View>
        </TouchableOpacity>

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setSelectedSongForPlaylist(song)}
                    style={styles.recentDownloadBtn}
                  >
                    <ListPlus size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => downloadSong(song)}
                    style={styles.recentDownloadBtn}
                  >
                    {isDownloading(song.id) ? (
                      <ActivityIndicator size="small" color="#1DB954" />
                    ) : isDownloaded(song.id) ? (
                      <CheckCircle size={18} color="#1DB954" />
                    ) : (
                      <Download size={18} color={COLORS.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        visible={selectedSongForPlaylist !== null}
        song={selectedSongForPlaylist}
        onClose={() => setSelectedSongForPlaylist(null)}
      />
    </SafeAreaView>
  );
};

export const YouTubeDownloaderScreen = DownloaderScreen;

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
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "visible",
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
  sampleSection: {
    marginBottom: SPACING.lg,
  },
  sampleList: {
    gap: SPACING.md,
    paddingRight: SPACING.screenPadding,
  },
  sampleCard: {
    width: 140,
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusMd,
    overflow: "hidden",
  },
  sampleThumb: {
    width: "100%",
    height: 90,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  sampleInfo: {
    padding: SPACING.sm,
  },
  sampleTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  sampleArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  offlineHubTextWrap: {
    flex: 1,
  },
  offlineBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: LAYOUT.radiusXs,
    marginBottom: 4,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
  },
  offlineHubTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
  },
  offlineHubSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: "rgba(255, 255, 255, 0.7)",
  },
  offlineHubArrow: {
    marginLeft: SPACING.sm,
  },
  extractorCard: {
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
    overflow: "hidden",
    position: "relative",
    marginBottom: SPACING.lg,
  },
  extractorGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  extractorHeader: {
    marginBottom: SPACING.md,
  },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: 0.8,
  },
  extractorTitle: {
    fontSize: TYPOGRAPHY.sizeTitle,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  extractorSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textLightMuted,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: LAYOUT.radiusFull,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: 10,
    marginBottom: SPACING.md,
  },
  inputField: {
    flex: 1,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizeBodySmall,
  },
  extractBtn: {
    borderRadius: LAYOUT.radiusFull,
    overflow: "hidden",
  },
  extractBtnGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  extractBtnText: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  resultCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.md,
  },
  resultHeaderText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: 0.8,
  },
  resultBody: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  resultThumb: {
    width: 72,
    height: 72,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  resultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  resultArtist: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qualityBadge: {
    backgroundColor: COLORS.accentAlpha15,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: LAYOUT.radiusXs,
  },
  qualityBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accentPrimary,
  },
  resultMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  quotaBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(252, 71, 92, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: LAYOUT.radiusFull,
    marginTop: 6,
  },
  quotaBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accentPrimary,
  },
  resultActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  actionIconBtnPrimary: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: SPACING.md,
  },
  recentSection: {
    marginBottom: SPACING.xl,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  recentThumb: {
    width: 48,
    height: 48,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  recentInfo: {
    flex: 1,
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
    width: 40,
    height: 40,
    borderRadius: LAYOUT.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
});
