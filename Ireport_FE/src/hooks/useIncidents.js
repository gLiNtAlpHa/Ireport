import {useState, useEffect, useCallback} from 'react';
import {incidentService} from '../services/incidentService';

export const useIncidents = (initialParams = {}) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchIncidents = useCallback(async (params = initialParams, reset = false) => {
    if (loading && !reset) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentPage = reset ? 0 : page;
      const requestParams = {
        ...params,
        limit: 20,
        offset: currentPage * 20,
      };
      
      const data = await incidentService.getIncidents(requestParams);
      
      if (reset) {
        setIncidents(data);
        setPage(1);
      } else {
        setIncidents(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(data.length === 20);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, page]);

  const refreshIncidents = useCallback(async (params = initialParams) => {
    setRefreshing(true);
    await fetchIncidents(params, true);
    setRefreshing(false);
  }, [fetchIncidents]);

  const loadMoreIncidents = useCallback(async (params = initialParams) => {
    if (!hasMore || loading) return;
    await fetchIncidents(params, false);
  }, [fetchIncidents, hasMore, loading]);

  useEffect(() => {
    fetchIncidents(initialParams, true);
  }, []);

  return {
    incidents,
    loading,
    error,
    refreshing,
    hasMore,
    fetchIncidents,
    refreshIncidents,
    loadMoreIncidents,
  };
};