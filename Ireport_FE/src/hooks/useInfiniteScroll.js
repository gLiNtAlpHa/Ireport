import {useState, useCallback} from 'react';

export const useInfiniteScroll = (fetchMore, hasMore) => {
  const [loading, setLoading] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      await fetchMore();
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchMore, hasMore, loading]);

  return {
    loading,
    handleLoadMore,
  };
};
