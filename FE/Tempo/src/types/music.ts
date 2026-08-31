/**
 * Strict TypeScript Types for Tempo Music App
 * Strictly follows STANDARDS.md - No any types
 */

export type MusicSource = 'zing' | 'audius' | 'youtube' | 'local';

export interface Artist {
  id: string;
  name: string;
  thumbnail?: string;
  link?: string;
  totalFollow?: number;
}

export interface Album {
  id: string;
  title: string;
  thumbnail?: string;
  artistsNames?: string;
  songs?: UnifiedSong[];
}

export interface UnifiedSong {
  id: string;
  rawId: string;
  source: MusicSource;
  title: string;
  artistsNames: string;
  artists?: Artist[];
  thumbnail: string;
  duration: number; // in seconds
  audioUrl?: string;
  localUri?: string;
  hasLyric?: boolean;
  album?: Album | null;
  rank?: number;
  score?: number;
  isVip?: boolean;
  isOffline?: boolean;
  genre?: string;
}

export interface LyricSentence {
  words: {
    startTime: number;
    endTime: number;
    data: string;
  }[];
}

export interface LyricData {
  lrcUrl: string | null;
  sentences: LyricSentence[];
}

export interface PlaylistSummary {
  id: string;
  title: string;
  thumbnail: string;
  artistsNames?: string;
  sortDescription?: string;
}

export interface HomeFeedData {
  banners: {
    id: string;
    title: string;
    description: string;
    cover: string;
    type: number;
  }[];
  newReleasesVPop: UnifiedSong[];
  featuredPlaylists: {
    title: string;
    link?: string;
    items: PlaylistSummary[];
  }[];
  globalTrending: UnifiedSong[];
}

export interface ChartData {
  chartTime?: number;
  items: UnifiedSong[];
}

export interface SearchResults {
  songs: UnifiedSong[];
  artists: Artist[];
  playlists: PlaylistSummary[];
}

export interface AIDJResponse {
  playlistTitle: string;
  moodDescription: string;
  genres: string[];
  songs: UnifiedSong[];
}
