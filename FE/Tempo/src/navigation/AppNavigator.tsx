/**
 * Navigation System - 5 Bottom Tabs (Tiếng Việt) + Stack Screens, 100% Tokenized
 * Strictly follows STANDARDS.md - Accent #FC475C -> #FC655A, NO EMOJIS, NO BORDERS
 */
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import {
  NavigationContainer,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Search, Library, Download, Crown } from "lucide-react-native";

import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { UpgradeScreen } from "../screens/UpgradeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PlaylistDetailScreen } from "../screens/PlaylistDetailScreen";
import { ArtistDetailScreen } from "../screens/ArtistDetailScreen";
import { SeeAllScreen } from "../screens/SeeAllScreen";
import { LikedSongsScreen } from "../screens/LikedSongsScreen";
import { DownloadedSongsScreen } from "../screens/DownloadedSongsScreen";
import { FollowedArtistsScreen } from "../screens/FollowedArtistsScreen";
import { DownloaderScreen } from "../screens/DownloaderScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { useAuthStore } from "../store/authStore";
import { useLibraryStore } from "../store/libraryStore";
import { useNavStore } from "../store/navStore";
import { usePlayerStore } from "../store/playerStore";
import { useSleepTimerStore } from "../store/sleepTimerStore";
import { useDownloadStore } from "../store/downloadStore";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";
import { navigationRef, navigate } from "./navigationRef";
export { navigationRef, navigate };

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom - 6 : 4;
  const navHeight = LAYOUT.tabBarHeight - 4 + (insets.bottom > 0 ? insets.bottom - 6 : 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => (
          <LinearGradient
            colors={["rgba(16, 16, 20, 0.95)", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: LAYOUT.borderNone,
          elevation: 0,
          shadowOpacity: 0,
          height: navHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.sizeMicro,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Trang chủ",
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: "Tìm kiếm",
          tabBarIcon: ({ color, focused }) => (
            <Search size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Downloads"
        component={DownloaderScreen}
        options={{
          tabBarLabel: "Tải xuống",
          tabBarIcon: ({ color, focused }) => (
            <Download size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: "Thư viện",
          tabBarIcon: ({ color, focused }) => (
            <Library size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Upgrade"
        component={UpgradeScreen}
        options={{
          tabBarLabel: "Nâng cấp",
          tabBarIcon: ({ color, focused }) => (
            <Crown size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

import { View, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SavedAlbumsScreen } from "../screens/SavedAlbumsScreen";
import { NotificationScreen } from "../screens/NotificationScreen";

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, initSession } = useAuthStore();

  React.useEffect(() => {
    initSession();
    usePlayerStore.getState().init();
    useSleepTimerStore.getState().init();
    useDownloadStore.getState().fetchDownloads();
  }, [initSession]);

  React.useEffect(() => {
    if (isAuthenticated) {
      const lib = useLibraryStore.getState();
      lib.fetchLikedSongs();
      lib.fetchPlaylists();
      lib.fetchFollowedArtists();
      lib.fetchSavedAlbums();
      lib.fetchHistory();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.accentPrimary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const route = navigationRef.getCurrentRoute();
        if (route) useNavStore.getState().setCurrentRoute(route.name);
      }}
      onStateChange={() => {
        const route = navigationRef.getCurrentRoute();
        if (route) useNavStore.getState().setCurrentRoute(route.name);
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.bgPrimary },
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
          detachPreviousScreen: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
        <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
        <Stack.Screen name="UpgradeScreen" component={UpgradeScreen} />
        <Stack.Screen name="SeeAll" component={SeeAllScreen} />
        <Stack.Screen name="LikedSongs" component={LikedSongsScreen} />
        <Stack.Screen name="DownloadedSongs" component={DownloadedSongsScreen} />
        <Stack.Screen name="FollowedArtists" component={FollowedArtistsScreen} />
        <Stack.Screen name="SavedAlbums" component={SavedAlbumsScreen} />
        <Stack.Screen name="Downloader" component={DownloaderScreen} />
        <Stack.Screen name="YouTubeDownloader" component={DownloaderScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
