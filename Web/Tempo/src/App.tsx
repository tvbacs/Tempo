import React, { useState, useEffect } from 'react';
import { Play, Volume2 } from 'lucide-react';
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
import { PlaylistView } from './screens/PlaylistView';
import { ArtistView } from './screens/ArtistView';

import { usePlayerStore } from './store/playerStore';
import { useAuthStore } from './store/authStore';
import { useLibraryStore } from './store/libraryStore';
import { useConnectStore } from './store/connectStore';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [previousTab, setPreviousTab] = useState<string>('home');

  const { initAudio, isLyricsOpen, isAutoplayBlocked } = usePlayerStore();
  const { user, isLoading: isAuthLoading, initSession } = useAuthStore();
  const { fetchLikedSongs, fetchPlaylists, fetchFollowedArtists, fetchSavedAlbums, fetchHistory } = useLibraryStore();
  const { initConnect } = useConnectStore();

  useEffect(() => {
    initAudio();
    initSession();
    initConnect();

    // Tự động mở khóa Autoplay Policy vĩnh viễn cho tab khi người dùng click/gõ phím bất kỳ
    const unlockAudio = () => {
      // 1. Phát buffer im lặng siêu ngắn để trình duyệt cấp quyền Audio vĩnh viễn cho tab
      try {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentAudio.volume = 0.01;
        silentAudio.play().catch(() => {});
      } catch (_) {}

      // 2. CHỈ phát nếu trước đó có lệnh phát nhưng bị trình duyệt chặn (isAutoplayBlocked === true)
      const ps = usePlayerStore.getState();
      const audio = ps.audioElement;
      if (ps.isAutoplayBlocked && audio && ps.currentSong && audio.src) {
        audio.play().then(() => {
          usePlayerStore.setState({ isPlaying: true, isAutoplayBlocked: false });
          useConnectStore.getState().broadcastState();
        }).catch(() => {});
      } else {
        usePlayerStore.setState({ isAutoplayBlocked: false });
      }

      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
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
      <div className="flex h-screen w-screen bg-[#000000] items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSelectPlaylist = (playlist: any) => {
    setPreviousTab(currentTab);
    setSelectedPlaylist(playlist);
    setCurrentTab('playlist');
  };

  const handleSelectArtist = (artist: any) => {
    setPreviousTab(currentTab);
    setSelectedArtist(artist);
    setCurrentTab('artist');
  };

  const renderMainContent = () => {
    if (isLyricsOpen || currentTab === 'lyrics') {
      return <LyricsView />;
    }

    if (searchQuery.trim().length > 0) {
      return <SearchView query={searchQuery} />;
    }

    switch (currentTab) {
      case 'home':
        return (
          <HomeDiscoverView
            onSeeAllChart={() => setCurrentTab('chart')}
            onSelectPlaylist={handleSelectPlaylist}
            onSelectArtist={handleSelectArtist}
          />
        );
      case 'search':
        return <SearchView query={searchQuery} />;
      case 'library':
        return (
          <LibraryView
            onSelectPlaylist={handleSelectPlaylist}
            onSelectArtist={handleSelectArtist}
          />
        );
      case 'liked':
        return <LikedSongsView />;
      case 'playlist':
        return selectedPlaylist ? (
          <PlaylistView
            playlist={selectedPlaylist}
            onBack={() => setCurrentTab(previousTab || 'library')}
          />
        ) : (
          <HomeDiscoverView
            onSeeAllChart={() => setCurrentTab('chart')}
            onSelectPlaylist={handleSelectPlaylist}
            onSelectArtist={handleSelectArtist}
          />
        );
      case 'artist':
        return selectedArtist ? (
          <ArtistView
            artist={selectedArtist}
            onBack={() => setCurrentTab(previousTab || 'home')}
          />
        ) : (
          <HomeDiscoverView
            onSeeAllChart={() => setCurrentTab('chart')}
            onSelectPlaylist={handleSelectPlaylist}
            onSelectArtist={handleSelectArtist}
          />
        );
      case 'downloads':
        return <DownloaderHomeView onViewDownloads={() => setCurrentTab('library')} />;
      case 'upgrade':
        return <UpgradeView />;
      case 'history':
        return <HistoryView />;
      case 'chart':
        return <ChartScreen />;
      default:
        return (
          <HomeDiscoverView
            onSeeAllChart={() => setCurrentTab('chart')}
            onSelectPlaylist={handleSelectPlaylist}
            onSelectArtist={handleSelectArtist}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-white overflow-hidden select-none font-sans">
      {/* 1. Top Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (q.trim()) setCurrentTab('search');
        }}
        onSearchFocus={() => setCurrentTab('search')}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* 2. 3-Column Layout Matching Spotify Reference */}
      <div className="flex-1 flex gap-2 px-2 pb-2 overflow-hidden">
        {/* Left Column: Navigation & Playlists */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onSelectPlaylist={handleSelectPlaylist}
          onSelectArtist={handleSelectArtist}
        />

        {/* Center Column: Main Interactive Screen */}
        <main className="flex-1 bg-[#121212] rounded-lg overflow-hidden flex flex-col relative border-none">
          {renderMainContent()}
        </main>

        {/* Right Column: Spotify-style Now Playing & Artist View */}
        {currentTab === 'downloads' ? <RightQueueSidebar /> : <RightNowPlayingSidebar />}
      </div>

      {/* 3. Bottom Player Bar */}
      <PlayerBar />

      {/* 4. Global Auth Modal */}
      <AuthModal />

      {/* 5. Autoplay Unlock Floating Notification */}
      {isAutoplayBlocked && (
        <div
          onClick={() => {
            const ps = usePlayerStore.getState();
            const audio = ps.audioElement;
            if (audio) {
              audio.play().then(() => {
                usePlayerStore.setState({ isPlaying: true, isAutoplayBlocked: false });
                useConnectStore.getState().broadcastState();
              }).catch(() => {});
            }
          }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-[#FC475C] text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 cursor-pointer animate-pulse hover:opacity-95 transition-all shadow-[#FC475C]/20"
        >
          <Play className="w-5 h-5 fill-white text-white" />
          <span className="text-sm font-bold">Trình duyệt đã tạm dừng · Nhấn vào đây để bật âm thanh</span>
        </div>
      )}
    </div>
  );
};
