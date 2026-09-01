/**
 * SavedAlbumsScreen - Danh Sách Album Đã Lưu
 * Strictly follows STANDARDS.md
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Disc,
  Search,
  X,
} from "lucide-react-native";
import { useLibraryStore } from "../store/libraryStore";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";

export const SavedAlbumsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { savedAlbums, fetchSavedAlbums } = useLibraryStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSavedAlbums();
  }, [fetchSavedAlbums]);

  const filteredAlbums = savedAlbums.filter((album) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      album.title.toLowerCase().includes(q) ||
      (album.artistsNames && album.artistsNames.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient
        colors={["#10223D", "#0B1626", COLORS.bgPrimary]}
        locations={[0, 0.4, 0.8]}
        style={styles.ambientGradient}
      />

      {/* Top Floating Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
          onPress={() => navigation.goBack()}
          style={styles.navCircleBtn}
        >
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.navTitle}>Album</Text>
        <View style={{ width: LAYOUT.iconButtonMd }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Album đã lưu</Text>
          <Text style={styles.subtitle}>
            {savedAlbums.length} album & tuyển tập yêu thích
          </Text>

          {savedAlbums.length > 0 && (
            <View style={styles.searchBar}>
              <Search size={16} color={COLORS.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm kiếm album..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.listContainer}>
          {filteredAlbums.length === 0 ? (
            <View style={styles.emptyState}>
              <Disc size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa lưu album nào</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `Không tìm thấy album nào khớp với "${searchQuery}"`
                  : "Chạm vào biểu tượng trái tim trên các album hoặc danh sách phát để lưu vào đây."}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
                style={styles.discoverBtn}
              >
                <Text style={styles.discoverBtnText}>Khám phá album</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.albumGrid}>
              {filteredAlbums.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("PlaylistDetail", {
                      id: album.id,
                      title: album.title,
                      thumbnail: album.thumbnail,
                      artistsNames: album.artistsNames,
                      songs: album.songs,
                    })
                  }
                  style={styles.albumCard}
                >
                  <Image
                    source={{
                      uri:
                        album.thumbnail ||
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
                    }}
                    style={styles.albumCover}
                  />
                  <Text numberOfLines={1} style={styles.albumTitle}>
                    {album.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.albumArtist}>
                    {album.songs?.length
                      ? `${album.songs.length} bài hát`
                      : album.artistsNames || "Album tuyển chọn"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  ambientGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 340,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    zIndex: 10,
  },
  navTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  navCircleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.xxxl,
  },
  headerSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  mainTitle: {
    fontSize: TYPOGRAPHY.sizeHero,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: LAYOUT.radiusFull,
    paddingHorizontal: SPACING.md,
    height: 46,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textPrimary,
  },
  listContainer: {
    paddingHorizontal: SPACING.screenPadding,
  },
  albumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    justifyContent: "space-between",
  },
  albumCard: {
    width: "47%",
    marginBottom: SPACING.md,
  },
  albumCover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs,
  },
  albumTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  albumArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 1.5,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: TYPOGRAPHY.lineHeightBody,
    marginBottom: SPACING.md,
  },
  discoverBtn: {
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.radiusFull,
  },
  discoverBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.white,
  },
});
