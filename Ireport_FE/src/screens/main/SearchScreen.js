import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useSearch} from '../../hooks/useSearch';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicInput from '../../components/UI/NeoInput';
import IncidentCard from '../../components/IncidentCard';
import EmptyState from '../../components/UI/EmptyState';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import FilterModal from '../../components/FilterModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {INCIDENT_CATEGORIES} from '../../utils/constants';

const SearchScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {
    query,
    setQuery,
    results,
    loading,
    filters,
    setFilters,
  } = useSearch();
  const [showFilterModal, setShowFilterModal] = useState(false);

  const recentSearches = ['broken window', 'lost keys', 'water leak'];

  const QuickFilters = () => (
    <View style={styles.quickFilters}>
      <Text style={[styles.filterTitle, {color: theme.colors.text}]}>
        Categories
      </Text>
      <FlatList
        data={INCIDENT_CATEGORIES}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              styles.quickFilterButton,
              {
                backgroundColor: filters.category === item.key
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => 
              setFilters({
                ...filters,
                category: filters.category === item.key ? null : item.key
              })
            }>
            <Text
              style={[
                styles.quickFilterText,
                {
                  color: filters.category === item.key
                    ? '#ffffff'
                    : theme.colors.text,
                },
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFiltersContainer}
      />
    </View>
  );

  const RecentSearches = () => (
    <NeumorphicCard style={styles.recentCard}>
      <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
        Recent Searches
      </Text>
      {recentSearches.map((search, index) => (
        <TouchableOpacity
          key={index}
          style={styles.recentItem}
          onPress={() => setQuery(search)}>
          <Icon name="history" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.recentText, {color: theme.colors.text}]}>
            {search}
          </Text>
        </TouchableOpacity>
      ))}
    </NeumorphicCard>
  );

  const SearchResults = () => {
    if (loading) {
      return <LoadingSpinner text="Searching..." />;
    }

    if (query && results.length === 0) {
      return (
        <EmptyState
          icon="search-off"
          title="No Results Found"
          subtitle={`No incidents found for "${query}"`}
          buttonTitle="Clear Search"
          onButtonPress={() => setQuery('')}
        />
      );
    }

    return (
      <FlatList
        data={results}
        renderItem={({item}) => (
          <IncidentCard
            incident={item}
            onPress={() =>
              navigation.navigate('IncidentDetails', {incidentId: item.id})
            }
          />
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <NeumorphicInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search incidents..."
            leftIcon={<Icon name="search" size={20} color={theme.colors.textSecondary} />}
            rightIcon={
              query ? (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Icon name="clear" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ) : null
            }
            style={styles.searchInput}
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}>
          <Icon name="tune" size={24} color={theme.colors.text} />
          {Object.keys(filters).some(key => filters[key]) && (
            <View style={[styles.filterBadge, {backgroundColor: theme.colors.primary}]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <QuickFilters />

      {/* Content */}
      {!query ? <RecentSearches /> : <SearchResults />}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={setFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    marginVertical: 0,
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickFilters: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickFiltersContainer: {
    paddingVertical: 4,
  },
  quickFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recentCard: {
    margin: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentText: {
    fontSize: 14,
    marginLeft: 8,
  },
  resultsList: {
    padding: 20,
    paddingTop: 0,
  },
});

export default SearchScreen;