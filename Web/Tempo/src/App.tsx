import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RightQueueSidebar } from './components/RightQueueSidebar';
import { PlayerBar } from './components/PlayerBar';
import { AuthModal } from './components/AuthModal';

import { DownloaderHomeView } from './screens/DownloaderHomeView';
import { LikedSongsView } from './screens/LikedSongsView';
import { HistoryView } from './screens/HistoryView';
import { SearchView } from './screens/SearchView';
import { LyricsView } from './screens/LyricsView';
import { ChartScreen } from './screens/ChartScreen';

import { usePlayerStore } from './store/playerStore';
import { useAuthStore } from './store/authStore';
import { useLibraryStore } from './store/libraryStore';
import { useConnectStore } from './store/connectStore';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('downloads');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { initAudio, isLyricsOpen } = usePlayerStore();
  const { initSession } = useAuthStore();
  const { fetchLikedSongs, fetchPlaylists, fetchFollowedArtists, fetchHistory } = useLibraryStore();
  const { initConnect } = useConnectStore();

  useEffect(() => {
    initAudio();
    initSession();
    initConnect();

    fetchLikedSongs();
    fetchPlaylists();
    fetchFollowedArtists();
    fetchHistory();
  }, []);

  const renderMainContent = () => {
    if (isLyricsOpen || currentTab === 'lyrics') {
      return <LyricsView />;
    }

    if (searchQuery.trim().length > 0) {
      return <SearchView query={searchQuery} />;
    }

    switch (currentTab) {
      case 'home':
      case 'downloads':
        return <DownloaderHomeView onViewDownloads={() => setCurrentTab('liked')} />;
      case 'library':
      case 'liked':
        return <LikedSongsView />;
      case 'history':
        return <HistoryView />;
      case 'chart':
        return <ChartScreen />;
      default:
        return <DownloaderHomeView onViewDownloads={() => setCurrentTab('liked')} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0B0E] text-white overflow-hidden select-none font-sans">
      {/* 1. Top Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchFocus={() => {}}
      />

      {/* 2. 3-Column Layout Matching User Mockup */}
      <div className="flex-1 flex gap-3 px-4 pb-3 overflow-hidden">
        {/* Left Column: Navigation & Playlists */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Center Column: Main Interactive Screen (Borderless Dark Card) */}
        <main className="flex-1 bg-[#121217] rounded-2xl overflow-hidden flex flex-col relative border-none">
          {renderMainContent()}
        </main>

        {/* Right Column: Download & Processing Queue */}
        <RightQueueSidebar />
      </div>

      {/* 3. Bottom Player Bar */}
      <PlayerBar />

      {/* 4. Global Auth Modal */}
      <AuthModal />
    </div>
  );
};
