import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useAdmin} from '../../context/AdminContext';
import {adminService} from '../../services/adminService';
import NeumorphicCard from '../../components/UI/NeumorphicCard';
import NeumorphicButton from '../../components/UI/NeumorphicButton';
import NeumorphicInput from '../../components/UI/NeumorphicInput';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AdminUsersScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {moderateUser} = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    is_active: null,
    is_admin: null,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const userData = await adminService.getUsers({
        search: searchQuery || undefined,
        ...filters,
        limit: 100,
      });
      setUsers(userData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, params = {}) => {
    try {
      await moderateUser(userId, action, params);
      await loadUsers(); // Refresh list
      setShowUserModal(false);
      
      const actionMessages = {
        activate: 'User activated successfully',
        deactivate: 'User deactivated successfully',
        make_admin: 'Admin privileges granted',
        remove_admin: 'Admin privileges removed',
        delete: 'User deleted successfully',
      };
      
      Alert.alert('Success', actionMessages[action]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Action failed');
    }
  };

  const showUserDetails = async (userId) => {
    try {
      const userDetails = await adminService.getUserDetails(userId);
      setSelectedUser(userDetails);
      setShowUserModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  const UserCard = ({user}) => (
    <NeumorphicCard 
      style={styles.userCard}
      onPress={() => showUserDetails(user.user_id)}
      pressable>
      
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {user.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, {color: theme.colors.text}]}>
              {user.full_name}
            </Text>
            <Text style={[styles.userEmail, {color: theme.colors.textSecondary}]}>
              {user.email}
            </Text>
            <Text style={[styles.userStats, {color: theme.colors.textSecondary}]}>
              {user.incidents_count} reports • {user.comments_count} comments
            </Text>
          </View>
        </View>
        
        <View style={styles.userBadges}>
          {user.is_admin && (
            <View style={[styles.badge, {backgroundColor: '#6366f1'}]}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
          <View style={[
            styles.badge,
            {backgroundColor: user.is_active ? '#10b981' : '#ef4444'}
          ]}>
            <Text style={styles.badgeText}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.memberSince, {color: theme.colors.textSecondary}]}>
        Member for {user.account_age_days} days
      </Text>
    </NeumorphicCard>
  );

  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}>
        
        <View style={styles.modalOverlay}>
          <NeumorphicCard style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                User Details
              </Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.modalUserInfo}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>
                  {selectedUser.user.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.modalUserName, {color: theme.colors.text}]}>
                {selectedUser.user.full_name}
              </Text>
              <Text style={[styles.modalUserEmail, {color: theme.colors.textSecondary}]}>
                {selectedUser.user.email}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatNumber, {color: theme.colors.text}]}>
                  {selectedUser.statistics.total_incidents}
                </Text>
                <Text style={[styles.modalStatLabel, {color: theme.colors.textSecondary}]}>
                  Incidents
                </Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatNumber, {color: theme.colors.text}]}>
                  {selectedUser.statistics.total_comments}
                </Text>
                <Text style={[styles.modalStatLabel, {color: theme.colors.textSecondary}]}>
                  Comments
                </Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatNumber, {color: theme.colors.text}]}>
                  {selectedUser.statistics.total_reactions}
                </Text>
                <Text style={[styles.modalStatLabel, {color: theme.colors.textSecondary}]}>
                  Reactions
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <NeumorphicButton
                title={selectedUser.user.is_active ? 'Deactivate' : 'Activate'}
                onPress={() => handleUserAction(
                  selectedUser.user.id,
                  selectedUser.user.is_active ? 'deactivate' : 'activate'
                )}
                variant={selectedUser.user.is_active ? 'warning' : 'success'}
                style={styles.modalActionButton}
              />
              
              {!selectedUser.user.is_admin ? (
                <NeumorphicButton
                  title="Make Admin"
                  onPress={() => handleUserAction(selectedUser.user.id, 'make_admin')}
                  variant="primary"
                  style={styles.modalActionButton}
                />
              ) : (
                <NeumorphicButton
                  title="Remove Admin"
                  onPress={() => handleUserAction(selectedUser.user.id, 'remove_admin')}
                  variant="secondary"
                  style={styles.modalActionButton}
                />
              )}
              
              <NeumorphicButton
                title="Delete User"
                onPress={() => {
                  Alert.alert(
                    'Confirm Deletion',
                    `Are you sure you want to delete ${selectedUser.user.full_name}?`,
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleUserAction(selectedUser.user.id, 'delete'),
                      },
                    ]
                  );
                }}
                variant="error"
                style={styles.modalActionButton}
              />
            </View>
          </NeumorphicCard>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Search and Filters */}
      <NeumorphicCard style={styles.searchCard}>
        <NeumorphicInput
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadUsers}
          leftIcon={<Icon name="search" size={20} color={theme.colors.textSecondary} />}
        />
        
        <View style={styles.filterRow}>
          <NeumorphicButton
            title="All"
            onPress={() => setFilters({is_active: null, is_admin: null})}
            variant={!filters.is_active && !filters.is_admin ? 'primary' : 'secondary'}
            style={styles.filterButton}
            textStyle={styles.filterText}
          />
          <NeumorphicButton
            title="Active"
            onPress={() => setFilters({...filters, is_active: true})}
            variant={filters.is_active === true ? 'primary' : 'secondary'}
            style={styles.filterButton}
            textStyle={styles.filterText}
          />
          <NeumorphicButton
            title="Inactive"
            onPress={() => setFilters({...filters, is_active: false})}
            variant={filters.is_active === false ? 'primary' : 'secondary'}
            style={styles.filterButton}
            textStyle={styles.filterText}
          />
          <NeumorphicButton
            title="Admins"
            onPress={() => setFilters({...filters, is_admin: true})}
            variant={filters.is_admin === true ? 'primary' : 'secondary'}
            style={styles.filterButton}
            textStyle={styles.filterText}
          />
        </View>
      </NeumorphicCard>

      {/* Users List */}
      {loading ? (
        <LoadingSpinner text="Loading users..." />
      ) : (
        <FlatList
          data={users}
          renderItem={({item}) => <UserCard user={item} />}
          keyExtractor={item => item.user_id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No Users Found"
              subtitle="No users match your search criteria"
            />
          }
        />
      )}

      <UserDetailsModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchCard: {
    margin: 20,
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 2,
    minHeight: 36,
  },
  filterText: {
    fontSize: 12,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  userCard: {
    marginBottom: 16,
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userStats: {
    fontSize: 12,
  },
  userBadges: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  memberSince: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 16,
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
  modalUserInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: 14,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: {
    gap: 12,
  },
  modalActionButton: {
    marginVertical: 4,
  },
});

export default AdminUsersScreen;
