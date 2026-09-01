import React, { useEffect, useState } from 'react';
import { ListMusic, Play, Pause, Shuffle, ArrowLeft, Loader2 } from 'lucide-react';
import { CustomPlaylist, UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { TrackTable } from '../components/TrackTable';

interface PlaylistViewProps {
  playlist: CustomPlaylist | any;
  onBack?: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, onBack }) => {
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentSong, isPlaying, isLoading: isPlayerLoading, playSong, togglePlayPause, isShuffle, toggleShuffle } = usePlayerStore();
  const { playlists } = useLibraryStore();

  const targetPlaylist = playlists.find((p) => p.id === playlist?.id) || playlist;

  const isCurrentListPlaying =
    isPlaying &&
    Boolean(
      currentSong &&
        songs.some(
          (s) => (s.encodeId || s.id) === (currentSong.encodeId || currentSong.id)
        )
    );

  useEffect(() => {
    if (!targetPlaylist) return;

    // 1. Nếu playlist/album đã có sẵn mảng songs (ví dụ daily_mix_1, playlist custom)
    if (targetPlaylist.songs && Array.isArray(targetPlaylist.songs) && targetPlaylist.songs.length > 0) {
      setSongs(targetPlaylist.songs);
      setIsLoading(false);
      return;
    }

    const playlistId = targetPlaylist.encodeId || targetPlaylist.id || targetPlaylist.album_id;

    // 2. Xử lý các chủ đề theme tĩnh từ mobile (theme_focus, theme_relax, theme_drive, theme_rain...)
    if (playlistId === 'theme_focus') {
      setIsLoading(true);
      apiClient.search('Lofi Chill').then((res) => {
        setSongs(res || []);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
      return;
    }
    if (playlistId === 'theme_relax') {
      setIsLoading(true);
      apiClient.search('Acoustic Chill').then((res) => {
        setSongs(res || []);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
      return;
    }
    if (playlistId === 'theme_drive') {
      setIsLoading(true);
      apiClient.search('Lái Xe Thư Giãn').then((res) => {
        setSongs(res || []);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
      return;
    }
    if (playlistId === 'theme_rain') {
      setIsLoading(true);
      apiClient.search('Nhạc Mưa').then((res) => {
        setSongs(res || []);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
      return;
    }

    // 3. Nếu là playlist custom của user từ Supabase (có user_id)
    const isCustom = Boolean(
      (targetPlaylist as any).user_id ||
      playlists.some((p: any) => p.id === targetPlaylist.id && p.user_id)
    );

    if (isCustom) {
      // Use user's exact playlist songs without server re-fetch
      setSongs(targetPlaylist.songs || []);
      setIsLoading(false);
      return;
    }

    // 4. Lấy từ API Zing / Server Backend theo id
    if (playlistId) {
      setIsLoading(true);
      apiClient
        .getPlaylist(playlistId)
        .then((res) => {
          if (res && res.songs && res.songs.length > 0) {
            setSongs(res.songs);
            setIsLoading(false);
          } else if (targetPlaylist.title) {
            apiClient.search(targetPlaylist.title).then((searchSongs) => {
              setSongs(searchSongs.length > 0 ? searchSongs : (targetPlaylist.songs || []));
              setIsLoading(false);
            }).catch(() => {
              setSongs(targetPlaylist.songs || []);
              setIsLoading(false);
            });
          } else {
            setSongs(targetPlaylist.songs || []);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (targetPlaylist.title) {
            apiClient.search(targetPlaylist.title).then((searchSongs) => {
              setSongs(searchSongs.length > 0 ? searchSongs : (targetPlaylist.songs || []));
              setIsLoading(false);
            }).catch(() => {
              setSongs(targetPlaylist.songs || []);
              setIsLoading(false);
            });
          } else {
            setSongs(targetPlaylist.songs || []);
            setIsLoading(false);
          }
        });
    } else {
      setSongs(targetPlaylist.songs || []);
    }
  }, [targetPlaylist, playlists]);

  const handlePlayClick = () => {
    if (songs.length === 0) return;
    if (isCurrentListPlaying) {
      togglePlayPause();
    } else {
      playSong(songs[0], songs);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none bg-[#121212]">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#2d2d38] via-[#1b1b22] to-[#121212] p-8 flex items-end gap-6 flex-shrink-0 relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors border-none cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="w-52 h-52 rounded-md bg-[#242424] overflow-hidden flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          {targetPlaylist.thumbnailM || targetPlaylist.thumbnail || targetPlaylist.coverUrl ? (
            <img
              src={targetPlaylist.thumbnailM || targetPlaylist.thumbnail || targetPlaylist.coverUrl}
              alt={targetPlaylist.name || targetPlaylist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ListMusic className="w-20 h-20 text-[#b3b3b3]" />
          )}
        </div>

        <div className="flex flex-col justify-end">
          <span className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
            Danh sách phát
          </span>
          <h1 className="text-5xl font-black text-white tracking-tight mb-4 line-clamp-2">
            {targetPlaylist.name || targetPlaylist.title}
          </h1>
          <p className="text-xs font-semibold text-white/90">
            {targetPlaylist.description || targetPlaylist.sortDescription || `${songs.length} bài hát`}
          </p>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-[#121212]/90 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePlayClick}
            disabled={songs.length === 0 || isLoading}
            className="w-14 h-14 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 border-none cursor-pointer"
          >
            {isCurrentListPlaying && isPlayerLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-black" />
            ) : isCurrentListPlaying ? (
              <Pause className="w-6 h-6 fill-black text-black" />
            ) : (
              <Play className="w-6 h-6 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleShuffle}
            title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
            className={`transition-colors border-none bg-transparent cursor-pointer p-1 ${
              isShuffle ? 'text-white font-bold scale-110' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            <Shuffle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Track Table */}
      <div className="px-8 pb-16">
        {isLoading ? (
          <div className="flex flex-col gap-2.5 pt-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-md bg-white/[0.02] animate-pulse">
                <div className="w-4 h-4 bg-white/10 rounded" />
                <div className="w-10 h-10 bg-white/10 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/10 rounded w-1/3" />
                  <div className="h-2.5 bg-white/5 rounded w-1/5" />
                </div>
                <div className="w-24 h-3 bg-white/5 rounded hidden md:block" />
                <div className="w-10 h-3 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center text-[#b3b3b3]">
            <ListMusic className="w-16 h-16 stroke-1 mb-3 text-[#535353]" />
            <h3 className="text-base font-bold text-white mb-1">Danh sách phát này chưa có bài hát</h3>
            <p className="text-xs text-[#b3b3b3] max-w-sm">
              Bạn có thể thêm các bài hát yêu thích vào danh sách phát này để nghe bất cứ lúc nào.
            </p>
          </div>
        ) : (
          <TrackTable songs={songs} />
        )}
      </div>
    </div>
  );
};
