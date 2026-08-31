export interface UnifiedSong {
  id: string;
  encodeId?: string;
  rawId?: string;
  title: string;
  artistsNames: string;
  thumbnail: string;
  thumbnailM?: string;
  duration: number; // in seconds
  audioUrl?: string;
  source?: 'zing' | 'audius' | 'youtube' | 'local';
  isVip?: boolean;
  hasLyric?: boolean;
  album?: {
    id?: string;
    title?: string;
    thumbnail?: string;
  };
  addedAt?: string;
}

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  songCount?: number;
  songs?: UnifiedSong[];
}

export interface Artist {
  id: string;
  name: string;
  alias: string;
  thumbnail?: string;
  cover?: string;
  totalFollow?: number;
  biography?: string;
}

export interface LyricSentence {
  startMs: number;
  endMs: number;
  words: string;
}
