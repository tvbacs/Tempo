import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RightQueueSidebar } from './components/RightQueueSidebar';
import { RightNowPlayingSidebar } from './components/RightNowPlayingSidebar';
import { PlayerBar } from './components/PlayerBar';
import { AuthModal } from './components/AuthModal';

import { HomeDiscoverView } from './screens/HomeDiscoverView';
import { DownloaderHomeView } from './screens/DownloaderHomeView';
import { LikedSongsView } from './screens/LikedSongsView';
import { LibraryView } from './screens/LibraryView';
import { HistoryView } from './screens/HistoryView';
import { SearchView } from './screens/SearchView';
import { LyricsView } from './screens/LyricsView';
import { ChartScreen } from './screens/ChartScreen';
import { UpgradeView } from './screens/UpgradeView';
import { AuthScreen } from './screens/AuthScreen';

import { usePlayerStore } from './store/playerStore';
import { useAuthStore } from './store/authStore';
import { useLibraryStore } from './store/libraryStore';
import { useConnectStore } from './store/connectStore';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { initAudio, isLyricsOpen } = usePlayerStore();
  const { user, isLoading: isAuthLoading, initSession } = useAuthStore();
  const { fetchLikedSongs, fetchPlaylists, fetchFollowedArtists, fetchSavedAlbums, fetchHistory } = useLibraryStore();
  const { initConnect } = useConnectStore();

  useEffect(() => {
    initAudio();
    initSession();
    initConnect();
  }, []);

  useEffect(() => {
    if (user) {
      fetchLikedSongs();
      fetchPlaylists();
      fetchFollowedArtists();
      fetchSavedAlbums();
      fetchHistory();
    }
  }, [user]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen bg-[#0B0B0E] items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-[#FC475C] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Bắt buộc đăng nhập đồng bộ dữ liệu với Mobile
  if (!user) {
    return <AuthScreen />;
  }

  const renderMainContent = () => {
    if (isLyricsOpen || currentTab === 'lyrics') {
      return <LyricsView />;
    }

    if (searchQuery.trim().length > 0) {
      return <SearchView query={searchQuery} />;
    }

    switch (currentTab) {
      case 'home':
        return <HomeDiscoverView onSeeAllChart={() => setCurrentTab('chart')} />;
      case 'search':
        return <SearchView query={searchQuery} />;
      case 'library':
        return <LibraryView />;
      case 'liked':
        return <LikedSongsView />;
      case 'downloads':
        return <DownloaderHomeView onViewDownloads={() => setCurrentTab('library')} />;
      case 'upgrade':
        return <UpgradeView />;
      case 'history':
        return <HistoryView />;
      case 'chart':
        return <ChartScreen />;
      default:
        return <HomeDiscoverView onSeeAllChart={() => setCurrentTab('chart')} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0B0E] text-white overflow-hidden select-none font-sans">
      {/* 1. Top Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (q.trim()) setCurrentTab('search');
        }}
        onSearchFocus={() => setCurrentTab('search')}
      />

      {/* 2. 3-Column Layout Matching User Mockup */}
      <div className="flex-1 flex gap-3 px-4 pb-3 overflow-hidden">
        {/* Left Column: Navigation & Playlists */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Center Column: Main Interactive Screen (Borderless Dark Card with reduced radius) */}
        <main className="flex-1 bg-[#121217] rounded-lg overflow-hidden flex flex-col relative border-none">
          {renderMainContent()}
        </main>

        {/* Right Column: Downloads Queue on 'downloads' tab, otherwise Spotify-style Now Playing & Artist View */}
        {currentTab === 'downloads' ? <RightQueueSidebar /> : <RightNowPlayingSidebar />}
      </div>

      {/* 3. Bottom Player Bar */}
      <PlayerBar />

      {/* 4. Global Auth Modal */}
      <AuthModal />
    </div>
  );
};
