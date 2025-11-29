import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import NeumorphicCard from './UI/NeoCard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {formatTimeAgo} from '../utils/helpers';

const CommentItem = ({comment, onDelete, canDelete}) => {
  const {theme} = useTheme();

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(comment.id),
        },
      ]
    );
  };

  return (
    <NeumorphicCard style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.authorInfo}>
          <View style={[styles.avatar, {backgroundColor: theme.colors.primary}]}>
            <Text style={styles.avatarText}>
              {comment.author.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.authorName, {color: theme.colors.text}]}>
              {comment.author.full_name}
            </Text>
            <Text style={[styles.timestamp, {color: theme.colors.textSecondary}]}>
              {formatTimeAgo(comment.created_at)}
            </Text>
          </View>
        </View>
        
        {canDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Icon name="delete" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.commentContent, {color: theme.colors.text}]}>
        {comment.content}
      </Text>
      
      {comment.is_flagged && (
        <View style={[styles.flaggedBadge, {backgroundColor: theme.colors.warning}]}>
          <Icon name="flag" size={12} color="#ffffff" />
          <Text style={styles.flaggedText}>Flagged</Text>
        </View>
      )}
    </NeumorphicCard>
  );
};

const CommentSection = ({comments, onDeleteComment, currentUserId}) => {
  const {theme} = useTheme();

  if (comments.length === 0) {
    return (
      <View style={styles.emptyComments}>
        <Text style={[styles.emptyText, {color: theme.colors.textSecondary}]}>
          No comments yet. Be the first to comment!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDeleteComment}
          canDelete={comment.author.id === currentUserId}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  commentCard: {
    marginBottom: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 18,
  },
  flaggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
  },
  flaggedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyComments: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default CommentSection;