import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {incidentService} from '../../services/incidentService';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicButton from '../../components/UI/NeoButton';
import NeumorphicInput from '../../components/UI/NeoInput';
import ReactionButtons from '../../components/ReactionButtons';
import CommentSection from '../../components/CommentSection';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getCategoryInfo, formatTimeAgo} from '../../utils/helpers';

const IncidentDetailsScreen = ({route, navigation}) => {
  const {incidentId} = route.params;
  const {theme} = useTheme();
  const {user} = useAuth();
  const [incident, setIncident] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadIncidentDetails();
  }, [incidentId]);

  const loadIncidentDetails = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [incidentData, commentsData] = await Promise.all([
        incidentService.getIncidentById(incidentId),
        incidentService.getComments(incidentId),
      ]);

      setIncident(incidentData);
      setComments(commentsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load incident details');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      await incidentService.toggleReaction(incidentId, reactionType);
      
      // Update local state optimistically
      setIncident(prev => ({
        ...prev,
        user_reaction: prev.user_reaction === reactionType ? null : reactionType,
        reactions_count: prev.user_reaction === reactionType 
          ? prev.reactions_count - 1 
          : prev.reactions_count + (prev.user_reaction ? 0 : 1)
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await incidentService.createComment(incidentId, newComment.trim());
      setNewComment('');
      await loadIncidentDetails(true); // Refresh to get new comment
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await incidentService.deleteComment(incidentId, commentId);
              setComments(prev => prev.filter(c => c.id !== commentId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleEditIncident = () => {
    navigation.navigate('EditIncident', {incident});
  };

  const handleDeleteIncident = () => {
    Alert.alert(
      'Delete Incident',
      'Are you sure you want to delete this incident? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await incidentService.deleteIncident(incidentId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete incident');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <LoadingSpinner text="Loading incident details..." />
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <Text style={[styles.errorText, {color: theme.colors.text}]}>
          Incident not found
        </Text>
      </View>
    );
  }

  const categoryInfo = getCategoryInfo(incident.category);
  const isAuthor = user?.id === incident.author.id;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadIncidentDetails(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }>
        
        {/* Main Content */}
        <NeumorphicCard style={styles.mainCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.categoryBadge, {backgroundColor: categoryInfo.color}]}>
                <Text style={styles.categoryText}>{categoryInfo.label}</Text>
              </View>
              <Text style={[styles.timestamp, {color: theme.colors.textSecondary}]}>
                {formatTimeAgo(incident.created_at)}
              </Text>
            </View>
            
            {isAuthor && (
              <View style={styles.authorActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleEditIncident}>
                  <Icon name="edit" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDeleteIncident}>
                  <Icon name="delete" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, {color: theme.colors.text}]}>
            {incident.title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
            {incident.description}
          </Text>

          {/* Location */}
          {incident.location && (
            <View style={styles.locationContainer}>
              <Icon name="location-on" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.locationText, {color: theme.colors.textSecondary}]}>
                {incident.location}
              </Text>
            </View>
          )}

          {/* Image */}
          {incident.image_url && (
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => setShowImageModal(true)}>
              <Image 
                source={{uri: incident.image_url}} 
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Icon name="fullscreen" size={24} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}

          {/* Author Info */}
          <View style={styles.authorContainer}>
            <TouchableOpacity
              style={styles.authorInfo}
              onPress={() => navigation.navigate('UserProfile', {userId: incident.author.id})}>
              <View style={styles.authorAvatar}>
                {incident.author.profile_image ? (
                  <Image 
                    source={{uri: incident.author.profile_image}} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {incident.author.full_name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View>
                <Text style={[styles.authorName, {color: theme.colors.text}]}>
                  {incident.author.full_name}
                </Text>
                <Text style={[styles.authorLabel, {color: theme.colors.textSecondary}]}>
                  Reporter
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Reactions */}
          <ReactionButtons
            currentReaction={incident.user_reaction}
            onReaction={handleReaction}
            style={styles.reactions}
          />
        </NeumorphicCard>

        {/* Comments Section */}
        <NeumorphicCard style={styles.commentsCard}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Comments ({comments.length})
          </Text>

          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <NeumorphicInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              multiline
              style={styles.commentInput}
            />
            <NeumorphicButton
              title="Post"
              onPress={handleAddComment}
              loading={submittingComment}
              disabled={!newComment.trim()}
              style={styles.postButton}
            />
          </View>

          {/* Comments List */}
          <CommentSection
            comments={comments}
            onDeleteComment={handleDeleteComment}
            currentUserId={user?.id}
          />
        </NeumorphicCard>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalOverlay}
            onPress={() => setShowImageModal(false)}>
            <Image 
              source={{uri: incident.image_url}} 
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImageModal(false)}>
            <Icon name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainCard: {
    margin: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 12,
  },
  authorActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 26,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorContainer: {
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorLabel: {
    fontSize: 12,
  },
  reactions: {
    marginTop: 16,
  },
  commentsCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addCommentContainer: {
    marginBottom: 20,
  },
  commentInput: {
    marginBottom: 12,
  },
  postButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
});

export default IncidentDetailsScreen;