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
        <div className="py-16 text-center text-text-secondary text-sm">Đang tìm kiếm...</div>
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
