import {useState, useEffect} from 'react';
import {incidentService} from '../services/incidentService';
import {useDebounce} from './useDebounce';

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  
  const debouncedQuery = useDebounce(query, 300);

  const search = async () => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await incidentService.searchIncidents({
        q: debouncedQuery,
        ...filters,
        limit: 50,
      });
      setResults(data);
      
      // Add to recent searches
      if (!recentSearches.includes(debouncedQuery)) {
        setRecentSearches(prev => [debouncedQuery, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
  }, [debouncedQuery, filters]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return {
    query,
    setQuery,
    results,
    loading,
    filters,
    setFilters,
    recentSearches,
    clearSearch,
  };
};