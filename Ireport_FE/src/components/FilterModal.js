import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import {useTheme} from '../context/ThemeContext';
import NeumorphicCard from './UI/NeoCard';
import NeumorphicButton from './UI/NeoButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {INCIDENT_CATEGORIES, INCIDENT_STATUS} from '../utils/constants';

const FilterModal = ({visible, onClose, filters, onApplyFilters}) => {
  const {theme} = useTheme();
  const [tempFilters, setTempFilters] = useState(filters);

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    setTempFilters({});
  };

  const CategoryFilter = () => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
        Category
      </Text>
      <View style={styles.filterGrid}>
        {INCIDENT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.filterOption,
              {
                backgroundColor: tempFilters.category === category.key
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() =>
              setTempFilters({
                ...tempFilters,
                category: tempFilters.category === category.key ? null : category.key,
              })
            }>
            <View style={[styles.categoryIcon, {backgroundColor: category.color}]}>
              <Text style={styles.categoryEmoji}>
                {getCategoryEmoji(category.key)}
              </Text>
            </View>
            <Text
              style={[
                styles.filterOptionText,
                {
                  color: tempFilters.category === category.key
                    ? '#ffffff'
                    : theme.colors.text,
                },
              ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const StatusFilter = () => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
        Status
      </Text>
      <View style={styles.statusGrid}>
        {Object.entries(INCIDENT_STATUS).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.statusOption,
              {
                backgroundColor: tempFilters.status === value
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() =>
              setTempFilters({
                ...tempFilters,
                status: tempFilters.status === value ? null : value,
              })
            }>
            <Text
              style={[
                styles.statusText,
                {
                  color: tempFilters.status === value
                    ? '#ffffff'
                    : theme.colors.text,
                },
              ]}>
              {key.replace('_', ' ').toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const SortFilter = () => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
        Sort By
      </Text>
      <View style={styles.sortGrid}>
        {[
          {key: 'created_at', label: 'Date'},
          {key: 'reactions_count', label: 'Reactions'},
          {key: 'comments_count', label: 'Comments'},
        ].map((sort) => (
          <TouchableOpacity
            key={sort.key}
            style={[
              styles.sortOption,
              {
                backgroundColor: tempFilters.sort_by === sort.key
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() =>
              setTempFilters({
                ...tempFilters,
                sort_by: tempFilters.sort_by === sort.key ? null : sort.key,
              })
            }>
            <Text
              style={[
                styles.sortText,
                {
                  color: tempFilters.sort_by === sort.key
                    ? '#ffffff'
                    : theme.colors.text,
                },
              ]}>
              {sort.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.5}>
      <NeumorphicCard style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
            Filter Incidents
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <CategoryFilter />
          <StatusFilter />
          <SortFilter />
        </ScrollView>

        {/* Actions */}
        <View style={styles.modalActions}>
          <NeumorphicButton
            title="Reset"
            onPress={handleReset}
            variant="secondary"
            style={styles.actionButton}
          />
          <NeumorphicButton
            title="Apply Filters"
            onPress={handleApply}
            style={styles.actionButton}
          />
        </View>
      </NeumorphicCard>
    </Modal>
  );
};

const getCategoryEmoji = (category) => {
  const emojis = {
    damages: '🔨',
    lost_and_found: '🔍',
    accidents: '⚠️',
    environmental_hazards: '🌿',
    notices_suggestions: '💡',
    complaints: '📢',
  };
  return emojis[category] || '📝';
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterOption: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusOption: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sortGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sortOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 0.45,
  },
});

export default FilterModal;
