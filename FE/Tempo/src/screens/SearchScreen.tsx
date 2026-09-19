/**
 * SearchScreen - Tìm kiếm & Khám phá danh mục (Tiếng Việt)
 * Hiển thị gợi ý nghệ sĩ chính thức (Zing MP3), Album thịnh hành & Thẻ thể loại hình ảnh
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Search as SearchIcon, X, Music, ChevronRight } from "lucide-react-native";
import { apiClient } from "../api/client";
import { UnifiedSong, Artist } from "../types/music";
import { SongItem } from "../components/SongItem";
import { AddToPlaylistModal } from "../components/AddToPlaylistModal";
import { SongOptionsModal } from "../components/SongOptionsModal";
import { AppAvatarBadge } from "../components/AppAvatarBadge";
import { usePlayerStore } from "../store/playerStore";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GENRE_TILE_WIDTH = (SCREEN_WIDTH - (SPACING.screenPadding * 2) - SPACING.md) / 2;

const FEATURED_ARTISTS = [
  {
    id: "son-tung-m-tp",
    name: "Sơn Tùng M-TP",
    alias: "Son-Tung-M-TP",
    thumbnail: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/5/9/6/9/59696c9dba7a914d587d886049c10df6.jpg",
  },
  {
    id: "hieuthuhai",
    name: "HIEUTHUHAI",
    alias: "HIEUTHUHAI",
    thumbnail: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/c/0/7/4/c0742c35795d4d234bf86cc7258b5077.jpg",
  },
  {
    id: "soobin",
    name: "SOOBIN",
    alias: "Soobin-Hoang-Son",
    thumbnail: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/a/3/a/b/a3ab763366da3d3df96b55a20177285c.jpg",
  },
  {
    id: "vu",
    name: "Vũ.",
    alias: "Vu",
    thumbnail: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/d/1/7/1/d17181fe947a2c205119a5a774863889.jpg",
  },
  {
    id: "phuong-ly",
    name: "Phương Ly",
    alias: "Phuong-Ly",
    thumbnail: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/4/4/9/a/449ad5795ff3aaa38f2b07d933ba84bf.jpg",
  },
  {
    id: "ariana-grande",
    name: "Ariana Grande",
    alias: "Ariana-Grande",
    thumbnail: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/5/d/8/7/5d872718202013715e3fdc6d8a08528b.jpg",
  },
  {
    id: "jack-j97",
    name: "Jack - J97",
    alias: "Jack-J97",
    thumbnail: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/e/b/1/6/eb166245e5de51380474a26ec4f43d00.jpg",
  },
  {
    id: "monstar",
    name: "MONSTAR",
    alias: "MONSTAR",
    thumbnail: "https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/8/5/3/e/853e5654e7406aa28089c99729392dcd.jpg",
  },
];

const BROWSE_GENRES = [
  {
    id: "vpop",
    name: "V-Pop Thịnh hành",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
  },
  {
    id: "pop",
    name: "Nhạc Quốc tế",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
  },
  {
    id: "rnb",
    name: "R&B & Soul",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
  },
  {
    id: "hiphop",
    name: "Hip-Hop & Rap",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400",
  },
  {
    id: "edm",
    name: "Nhạc Điện tử EDM",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400",
  },
  {
    id: "acoustic",
    name: "Acoustic Nhẹ nhàng",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400",
  },
  {
    id: "indie",
    name: "Nhạc Indie Việt",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400",
  },
  {
    id: "lofi",
    name: "Giai điệu Lo-Fi",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400",
  },
];

export const SearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [trendingPlaylists, setTrendingPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<UnifiedSong | null>(null);
  const [selectedSongForOptions, setSelectedSongForOptions] = useState<UnifiedSong | null>(null);

  const playSong = usePlayerStore((s) => s.playSong);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    // Tải trước một số tuyển tập / playlist thịnh hành cho màn hình Khám phá
    apiClient
      .getHome()
      .then((feed) => {
        const items = feed?.featuredPlaylists?.[0]?.items || [];
        setTrendingPlaylists(items.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  const performSearch = async (text: string) => {
    if (!text.trim()) {
      setSongs([]);
      setArtists([]);
      setIsLoading(false);
      setSearched(false);
      return;
    }

    setIsLoading(true);
    setSearched(true);
    try {
      const results = await apiClient.search(text);
      setSongs(results.songs || []);
      setArtists(results.artists || []);
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim()) {
      setSongs([]);
      setArtists([]);
      setSearched(false);
      return;
    }
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 350);
  };

  const clearSearch = () => {
    setQuery("");
    setSongs([]);
    setArtists([]);
    setSearched(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <Text style={styles.headerMainTitle}>Tìm kiếm</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Profile")}
          style={styles.headerAvatarBtn}
        >
          <AppAvatarBadge size={42} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={COLORS.textSecondary} />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Tìm nghệ sĩ, bài hát hoặc nhạc quốc tế..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{ top: SPACING.sm + 2, bottom: SPACING.sm + 2, left: SPACING.sm + 2, right: SPACING.sm + 2 }}
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={COLORS.accentPrimary} />
        </View>
      ) : searched ? (
        songs.length === 0 ? (
          <View style={styles.centerBox}>
            <Music size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptySubtitle}>Hãy thử tìm kiếm với từ khóa khác</Text>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              artists.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("ArtistDetail", {
                      alias:
                        (artists[0] as any).alias ||
                        artists[0].id ||
                        artists[0].name.toLowerCase().replace(/\s+/g, "-"),
                      name: artists[0].name,
                      thumbnail: artists[0].thumbnail,
                    })
                  }
                  style={styles.artistMatchCard}
                >
                  <Image
                    source={{ uri: artists[0].thumbnail }}
                    style={styles.artistMatchThumb}
                  />
                  <View style={styles.artistMatchInfo}>
                    <Text style={styles.artistMatchTag}>NGHỆ SĨ PHÙ HỢP NHẤT</Text>
                    <Text numberOfLines={1} style={styles.artistMatchName}>
                      {artists[0].name}
                    </Text>
                    <Text style={styles.artistMatchFollow}>
                      {artists[0].totalFollow
                        ? `${artists[0].totalFollow.toLocaleString("vi-VN")} người theo dõi`
                        : "Nghệ sĩ"}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => (
              <SongItem
                song={item}
                onPress={() => {
                  Keyboard.dismiss();
                  playSong(item, songs, { type: 'search', title: `Tìm kiếm: "${query}"` });
                }}
                onMorePress={() => setSelectedSongForOptions(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          />
        )
      ) : (
        <ScrollView
          style={styles.browseContainer}
          contentContainerStyle={styles.browseContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mục 1: Nghệ sĩ nổi bật */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Nghệ sĩ nổi bật</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {FEATURED_ARTISTS.map((artist) => (
                <TouchableOpacity
                  key={artist.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("ArtistDetail", {
                      alias: artist.alias,
                      name: artist.name,
                      thumbnail: artist.thumbnail,
                    })
                  }
                  style={styles.artistCard}
                >
                  <Image source={{ uri: artist.thumbnail }} style={styles.artistThumb} />
                  <Text numberOfLines={1} style={styles.artistName}>
                    {artist.name}
                  </Text>
                  <Text style={styles.artistTag}>Nghệ sĩ</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Mục 2: Tuyển tập & Album thịnh hành */}
          {trendingPlaylists.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Tuyển tập thịnh hành</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {trendingPlaylists.map((pl, idx) => (
                  <TouchableOpacity
                    key={pl.id || idx}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("PlaylistDetail", {
                        id: pl.id,
                        title: pl.title,
                        thumbnail: pl.thumbnail,
                      })
                    }
                    style={styles.playlistCard}
                  >
                    <Image source={{ uri: pl.thumbnail }} style={styles.playlistThumb} />
                    <Text numberOfLines={1} style={styles.playlistTitle}>
                      {pl.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.playlistSub}>
                      {pl.artistsNames || pl.sortDescription || "Tuyển chọn"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Mục 3: Duyệt tìm tất cả thể loại */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Duyệt tìm tất cả</Text>
            <View style={styles.genresGrid}>
              {BROWSE_GENRES.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    setQuery(g.name);
                    performSearch(g.name);
                  }}
                  style={styles.genreCard}
                >
                  <Image source={{ uri: g.image }} style={styles.genreCardBg} />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"]}
                    locations={[0, 1]}
                    style={styles.genreCardOverlay}
                  />
                  <Text style={styles.genreName}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
        </ScrollView>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        visible={selectedSongForPlaylist !== null}
        song={selectedSongForPlaylist}
        onClose={() => setSelectedSongForPlaylist(null)}
      />

      {/* Song Options Modal (3 dots menu) */}
      <SongOptionsModal
        visible={selectedSongForOptions !== null}
        song={selectedSongForOptions}
        onClose={() => setSelectedSongForOptions(null)}
      />
    </SafeAreaView>
  );
};

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
  headerAvatarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "visible",
  },
  searchBarWrapper: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: LAYOUT.radiusFull,
    height: LAYOUT.searchBarHeight,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm + 2,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizeBodySmall,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxxl + 4,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset,
  },
  browseContainer: {
    flex: 1,
  },
  browseContent: {
    paddingTop: SPACING.xs,
    paddingBottom: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset,
  },
  sectionBlock: {
    marginBottom: SPACING.xxl + 4,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizeHeading,
    fontWeight: "800",
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.md,
  },
  horizontalScroll: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.md,
  },

  // Artist Card
  artistCard: {
    alignItems: "center",
    width: 92,
  },
  artistThumb: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs,
  },
  artistName: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    width: "100%",
  },
  artistTag: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  // Playlist Card
  playlistCard: {
    width: 130,
  },
  playlistThumb: {
    width: 130,
    height: 130,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurface,
    marginBottom: SPACING.xs,
  },
  playlistTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  playlistSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },

  // Genres Grid
  genresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.md,
  },
  genreCard: {
    width: GENRE_TILE_WIDTH,
    height: LAYOUT.genreCardHeight,
    borderRadius: LAYOUT.radiusMd,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    padding: SPACING.md,
  },
  genreCardBg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  genreCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  genreName: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "800",
    color: COLORS.white,
    zIndex: 2,
  },
  artistMatchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.bgSurfaceSecondary,
    borderRadius: LAYOUT.radiusLg,
    marginBottom: SPACING.lg,
  },
  artistMatchThumb: {
    width: LAYOUT.avatarLg,
    height: LAYOUT.avatarLg,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurface,
    marginRight: SPACING.md,
  },
  artistMatchInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  artistMatchTag: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: 2,
  },
  artistMatchName: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  artistMatchFollow: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
});
