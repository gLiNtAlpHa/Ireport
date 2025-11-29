import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useApp} from '../context/AppContext';
import NeumorphicCard from './UI/NeoCard';
import ReactionButtons from './ReactionButtons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getCategoryInfo, formatTimeAgo} from '../utils/helpers';

const IncidentCard = ({incident, onPress, showReactions = true}) => {
  const {theme} = useTheme();
  const {toggleReaction} = useApp();
  const categoryInfo = getCategoryInfo(incident.category);

  const handleReaction = async (reactionType) => {
    try {
      await toggleReaction(incident.id, reactionType);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <NeumorphicCard 
      style={styles.card} 
      onPress={onPress} 
      pressable 
      animated>
      
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.categoryBadge,
            {backgroundColor: categoryInfo.color},
          ]}>
          <Text style={styles.categoryText}>
            {categoryInfo.label}
          </Text>
        </View>
        
        <Text style={[styles.date, {color: theme.colors.textSecondary}]}>
          {formatTimeAgo(incident.created_at)}
        </Text>
      </View>

      {/* Content */}
      <Text style={[styles.title, {color: theme.colors.text}]}>
        {incident.title}
      </Text>

      <Text
        style={[styles.description, {color: theme.colors.textSecondary}]}
        numberOfLines={3}>
        {incident.description}
      </Text>

      {/* Image */}
      {incident.image_url && (
        <Image 
          source={{uri: incident.image_url}} 
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Location */}
      {incident.location && (
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.locationText, {color: theme.colors.textSecondary}]}>
            {incident.location}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, {color: theme.colors.text}]}>
            {incident.author.full_name}
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Icon name="comment" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.statText, {color: theme.colors.textSecondary}]}>
              {incident.comments_count}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="thumb-up" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.statText, {color: theme.colors.textSecondary}]}>
              {incident.reactions_count}
            </Text>
          </View>
        </View>
      </View>

      {/* Reactions */}
      {showReactions && (
        <ReactionButtons
          currentReaction={incident.user_reaction}
          onReaction={handleReaction}
          style={styles.reactions}
        />
      )}
    </NeumorphicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  reactions: {
    marginTop: 8,
  },
});

export default IncidentCard;
