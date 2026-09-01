import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { TrackTable } from '../components/TrackTable';

interface SearchViewProps {
  query: string;
}

export const SearchView: React.FC<SearchViewProps> = ({ query }) => {
  const [results, setResults] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let isMounted = true;
    setIsLoading(true);

    const timeout = setTimeout(() => {
      apiClient.search(query).then((songs) => {
        if (isMounted) {
          setResults(songs);
          setIsLoading(false);
        }
      });
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8 select-none">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">
          {query ? `Kết quả tìm kiếm cho "${query}"` : 'Tìm kiếm'}
        </h1>
        {!query && (
          <p className="text-xs text-text-secondary mt-1">
            Nhập tên bài hát, nghệ sĩ hoặc album vào thanh tìm kiếm ở trên
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5 pt-2">
          {[...Array(6)].map((_, i) => (
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
      ) : results.length > 0 ? (
        <TrackTable songs={results} />
      ) : query ? (
        <div className="py-16 text-center text-text-muted text-sm">
          Không tìm thấy bài hát nào phù hợp với "{query}"
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center py-20">
          <Search className="w-16 h-16 mb-4 stroke-1 opacity-40" />
          <p className="text-base font-bold text-white mb-1">Khám phá nội dung âm nhạc</p>
          <p className="text-xs text-text-secondary max-w-sm">
            Tìm kiếm mọi bài hát yêu thích của bạn từ kho nhạc trực tuyến
          </p>
        </div>
      )}
    </div>
  );
};
