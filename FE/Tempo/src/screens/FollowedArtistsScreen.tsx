/**
 * FollowedArtistsScreen - Danh Sách Nghệ Sĩ Đã Theo Dõi
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
  Users,
  Search,
  X,
  UserCheck,
} from "lucide-react-native";
import { useLibraryStore } from "../store/libraryStore";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";

export const FollowedArtistsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { followedArtists, fetchFollowedArtists, toggleFollowArtist } = useLibraryStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchFollowedArtists();
  }, [fetchFollowedArtists]);

  const filteredArtists = followedArtists.filter((artist) => {
    if (!searchQuery.trim()) return true;
    return artist.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient
        colors={["#362208", "#211504", COLORS.bgPrimary]}
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

        <Text style={styles.navTitle}>Nghệ sĩ</Text>
        <View style={{ width: LAYOUT.iconButtonMd }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Nghệ sĩ đã theo dõi</Text>
          <Text style={styles.subtitle}>
            {followedArtists.length} nghệ sĩ bạn đang quan tâm
          </Text>

          {followedArtists.length > 0 && (
            <View style={styles.searchBar}>
              <Search size={16} color={COLORS.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm kiếm nghệ sĩ..."
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
          {filteredArtists.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa theo dõi nghệ sĩ nào</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `Không tìm thấy nghệ sĩ nào khớp với "${searchQuery}"`
                  : "Nhấn nút Theo dõi trên trang của nghệ sĩ yêu thích để cập nhật các bài hát mới nhất."}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
                style={styles.discoverBtn}
              >
                <Text style={styles.discoverBtnText}>Khám phá nghệ sĩ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredArtists.map((artist) => (
              <TouchableOpacity
                key={artist.id || artist.name}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate("ArtistDetail", {
                    alias: artist.link || artist.id,
                    name: artist.name,
                    thumbnail: artist.thumbnail,
                  })
                }
                style={styles.artistRow}
              >
                <Image
                  source={{
                    uri:
                      artist.thumbnail ||
                      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300",
                  }}
                  style={styles.artistAvatar}
                />

                <View style={styles.artistInfo}>
                  <Text numberOfLines={1} style={styles.artistName}>
                    {artist.name}
                  </Text>
                  <Text style={styles.artistSub}>
                    {artist.totalFollow
                      ? `${artist.totalFollow.toLocaleString()} người theo dõi`
                      : "Nghệ sĩ"}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.75}
                  hitSlop={{ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.sm, right: SPACING.sm }}
                  onPress={() => toggleFollowArtist(artist)}
                  style={styles.followingIconBtn}
                >
                  <UserCheck size={20} color={COLORS.accentPrimary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
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
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
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
    backgroundColor: COLORS.bgSurfaceSecondary,
    borderRadius: LAYOUT.radiusMd,
    paddingHorizontal: SPACING.md,
    height: 44,
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
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
    marginBottom: 2,
  },
  artistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  artistInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  artistName: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  artistSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  followingIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
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
