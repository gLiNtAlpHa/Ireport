import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useApp} from '../../context/AppContext';
import {useNotifications} from '../../context/NotificationContext';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicButton from '../../components/UI/NeoButton';
import IncidentCard from '../../components/IncidentCard';
import FilterModal from '../../components/FilterModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {INCIDENT_CATEGORIES} from '../../utils/constants';

const HomeScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {
    incidents,
    loading,
    refreshing,
    filters,
    isOnline,
    offlineActionsCount,
    setFilters,
    loadIncidents,
  } = useApp();
  const {unreadCount} = useNotifications();
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    loadIncidents(true);
  }, []);

  const onRefresh = () => {
    loadIncidents(true);
  };

  const handleCategorySelect = (category) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    setFilters({...filters, category: newCategory});
  };

  const CategoryButton = ({category}) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        {
          backgroundColor:
            selectedCategory === category.key
              ? theme.colors.primary
              : theme.colors.surface,
        },
      ]}
      onPress={() => handleCategorySelect(category.key)}>
      <Text
        style={[
          styles.categoryText,
          {
            color:
              selectedCategory === category.key
                ? '#ffffff'
                : theme.colors.text,
          },
        ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="report-problem" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
        No Incidents Found
      </Text>
      <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
        Be the first to report an incident in your area
      </Text>
      <NeumorphicButton
        title="Create Report"
        onPress={() => navigation.navigate('Create')}
        style={styles.emptyButton}
      />
    </View>
  );

  const OfflineIndicator = () => {
    if (isOnline) return null;
    
    return (
      <NeumorphicCard style={[styles.offlineCard, {backgroundColor: '#f59e0b'}]}>
        <View style={styles.offlineContent}>
          <Icon name="wifi-off" size={20} color="#ffffff" />
          <Text style={styles.offlineText}>
            You're offline. {offlineActionsCount > 0 && `${offlineActionsCount} actions pending sync.`}
          </Text>
        </View>
      </NeumorphicCard>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar 
        backgroundColor={theme.colors.background} 
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Recent Reports
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            Stay informed about campus incidents
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Notifications')}>
            <Icon name="notifications" size={24} color={theme.colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.badge, {backgroundColor: theme.colors.error}]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <NeumorphicButton
            title="+ Report"
            onPress={() => navigation.navigate('Create')}
            style={styles.createButton}
            textStyle={styles.createButtonText}
          />
        </View>
      </View>

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Categories Filter */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={INCIDENT_CATEGORIES}
          renderItem={({item}) => <CategoryButton category={item} />}
          keyExtractor={item => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}>
          <Icon name="filter-list" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Incidents List */}
      <FlatList
        data={incidents}
        renderItem={({item}) => (
          <IncidentCard
            incident={item}
            onPress={() =>
              navigation.navigate('IncidentDetails', {incidentId: item.id})
            }
          />
        )}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.incidentsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading && <EmptyState />}
        onEndReached={() => loadIncidents(false)}
        onEndReachedThreshold={0.5}
      />

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 16,
    minHeight: 40,
  },
  createButtonText: {
    fontSize: 14,
  },
  offlineCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  categoriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterButton: {
    marginLeft: 10,
    padding: 8,
  },
  incidentsList: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
});

export default HomeScreen;