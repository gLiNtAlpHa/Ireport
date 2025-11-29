import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {userService} from '../../services/userService';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicButton from '../../components/UI/NeoButton';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = ({navigation}) => {
  const {theme, toggleTheme, isDark} = useTheme();
  const {user, logout} = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await userService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const ProfileHeader = () => (
    <NeumorphicCard style={styles.headerCard}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user?.profile_image ? (
            <Image source={{uri: user.profile_image}} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, {backgroundColor: theme.colors.primary}]}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={() => navigation.navigate('EditProfile')}>
            <Icon name="edit" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, {color: theme.colors.text}]}>
            {user?.full_name}
          </Text>
          <Text style={[styles.userEmail, {color: theme.colors.textSecondary}]}>
            {user?.email}
          </Text>
          {user?.is_admin && (
            <View style={[styles.adminBadge, {backgroundColor: theme.colors.primary}]}>
              <Icon name="admin-panel-settings" size={12} color="#ffffff" />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>
      </View>
      
      {userStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: theme.colors.text}]}>
              {userStats.total_incidents}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>
              Reports
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: theme.colors.text}]}>
              {userStats.total_comments}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>
              Comments
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: theme.colors.text}]}>
              {userStats.total_reactions}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>
              Reactions
            </Text>
          </View>
        </View>
      )}
    </NeumorphicCard>
  );

  const MenuOption = ({icon, title, subtitle, onPress, showArrow = true}) => (
    <TouchableOpacity
      style={[styles.menuOption, {borderBottomColor: theme.colors.border}]}
      onPress={onPress}>
      <View style={styles.menuLeft}>
        <Icon name={icon} size={24} color={theme.colors.text} />
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, {color: theme.colors.text}]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.menuSubtitle, {color: theme.colors.textSecondary}]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <LoadingSpinner text="Loading profile..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader />

        {/* Account Section */}
        <NeumorphicCard style={styles.menuCard}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Account
          </Text>
          
          <MenuOption
            icon="edit"
            title="Edit Profile"
            subtitle="Update your information"
            onPress={() => navigation.navigate('EditProfile')}
          />
          
          <MenuOption
            icon="assignment"
            title="My Reports"
            subtitle="View your incident reports"
            onPress={() => navigation.navigate('MyIncidents')}
          />
          
          <MenuOption
            icon="security"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </NeumorphicCard>

        {/* Settings Section */}
        <NeumorphicCard style={styles.menuCard}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Settings
          </Text>
          
          <MenuOption
            icon={isDark ? 'light-mode' : 'dark-mode'}
            title="Theme"
            subtitle={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onPress={toggleTheme}
            showArrow={false}
          />
          
          <MenuOption
            icon="notifications"
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          
          <MenuOption
            icon="language"
            title="Language"
            subtitle="English (Default)"
            onPress={() => {}}
          />
          
          <MenuOption
            icon="settings"
            title="App Settings"
            subtitle="Privacy and other settings"
            onPress={() => navigation.navigate('Settings')}
          />
        </NeumorphicCard>

        {/* Admin Section */}
        {user?.is_admin && (
          <NeumorphicCard style={styles.menuCard}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Administration
            </Text>
            
            <MenuOption
              icon="dashboard"
              title="Admin Dashboard"
              subtitle="Manage users and content"
              onPress={() => navigation.navigate('Admin')}
            />
          </NeumorphicCard>
        )}

        {/* Support Section */}
        <NeumorphicCard style={styles.menuCard}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Support
          </Text>
          
          <MenuOption
            icon="help"
            title="Help & FAQ"
            subtitle="Get help and answers"
            onPress={() => {}}
          />
          
          <MenuOption
            icon="feedback"
            title="Send Feedback"
            subtitle="Help us improve the app"
            onPress={() => {}}
          />
          
          <MenuOption
            icon="info"
            title="About"
            subtitle="App version and info"
            onPress={() => {}}
          />
        </NeumorphicCard>

        {/* Logout */}
        <NeumorphicButton
          title="Logout"
          onPress={handleLogout}
          variant="error"
          style={styles.logoutButton}
          icon={<Icon name="logout" size={20} color="#ffffff" />}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 20,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  menuCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    marginLeft: 16,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    margin: 20,
    marginTop: 0,
  },
});

export default ProfileScreen;
