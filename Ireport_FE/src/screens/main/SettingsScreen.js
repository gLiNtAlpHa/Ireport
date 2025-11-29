import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import NeumorphicCard from '../../components/UI/NeoCard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DeviceInfo from 'react-native-device-info';

const SettingsScreen = ({navigation}) => {
  const {theme, toggleTheme, isDark} = useTheme();
  const {user} = useAuth();

  const SettingItem = ({icon, title, subtitle, onPress, rightComponent, showArrow = true}) => (
    <TouchableOpacity
      style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
      onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={theme.colors.text} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, {color: theme.colors.text}]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, {color: theme.colors.textSecondary}]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && (
          <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact support?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@studentireport.com'),
        },
      ]
    );
  };

  const handleRateApp = () => {
    // In a real app, you'd link to the app store
    Alert.alert('Rate App', 'Thank you for using Student iReport!');
  };

  const handleShareApp = () => {
    // In a real app, you'd use react-native-share
    Alert.alert('Share App', 'Share Student iReport with your friends!');
  };

  const showAbout = async () => {
    const version = await DeviceInfo.getVersion();
    const buildNumber = await DeviceInfo.getBuildNumber();
    
    Alert.alert(
      'About Student iReport',
      `Version: ${version} (${buildNumber})\n\nA comprehensive incident reporting system for educational institutions.\n\nDeveloped with ❤️ for student safety.`,
      [{text: 'OK'}]
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView>
        {/* Appearance */}
        <NeumorphicCard style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Appearance
          </Text>
          
          <SettingItem
            icon={isDark ? 'light-mode' : 'dark-mode'}
            title="Theme"
            subtitle={isDark ? 'Dark mode enabled' : 'Light mode enabled'}
            onPress={toggleTheme}
            rightComponent={
              <View style={[
                styles.toggle,
                {backgroundColor: isDark ? theme.colors.primary : theme.colors.border}
              ]}>
                <View style={[
                  styles.toggleThumb,
                  {
                    backgroundColor: '#ffffff',
                    transform: [{translateX: isDark ? 20 : 2}],
                  }
                ]} />
              </View>
            }
            showArrow={false}
          />
        </NeumorphicCard>

        {/* Notifications */}
        <NeumorphicCard style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Notifications
          </Text>
          
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Manage notification preferences"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          
          <SettingItem
            icon="email"
            title="Email Notifications"
            subtitle="Control email alerts"
            onPress={() => {}}
          />
        </NeumorphicCard>

        {/* Privacy & Security */}
        <NeumorphicCard style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Privacy & Security
          </Text>
          
          <SettingItem
            icon="lock"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          
          <SettingItem
            icon="privacy-tip"
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => Linking.openURL('https://studentireport.com/privacy')}
          />
          
          <SettingItem
            icon="description"
            title="Terms of Service"
            subtitle="View terms and conditions"
            onPress={() => Linking.openURL('https://studentireport.com/terms')}
          />
        </NeumorphicCard>

        {/* Data & Storage */}
        <NeumorphicCard style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Data & Storage
          </Text>
          
          <SettingItem
            icon="cloud-download"
            title="Download My Data"
            subtitle="Export your account data"
            onPress={() => Alert.alert('Feature Coming Soon', 'Data export will be available in a future update.')}
          />
          
          <SettingItem
            icon="delete-sweep"
            title="Clear Cache"
            subtitle="Free up storage space"
            onPress={() => {
              Alert.alert(
                'Clear Cache',
                'This will clear temporary files and may improve performance.',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared successfully')},
                ]
              );
            }}
          />
        </NeumorphicCard>

        {/* Support */}
        <NeumorphicCard style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Support
          </Text>
          
          <SettingItem
            icon="help"
            title="Help Center"
            subtitle="Get help and answers"
            onPress={() => {}}
          />
          
          <SettingItem
            icon="support-agent"
            title="Contact Support"
            subtitle="Get in touch with our team"
            onPress={handleContactSupport}
          />
          
          <SettingItem
            icon="bug-report"
            title="Report a Bug"
            subtitle="Help us improve the app"
            onPress={() => Linking.openURL('mailto:bugs@studentireport.com?subject=Bug Report')}
          />
          
          <SettingItem
            icon="feedback"
            title="Send Feedback"
            subtitle="Share your thoughts"
            onPress={() => Linking.openURL('mailto:feedback@studentireport.com?subject=App Feedback')}
          />
        </NeumorphicCard>

        {/* About */}
        <NeumorphicCard style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            About
          </Text>
          
          <SettingItem
            icon="star"
            title="Rate App"
            subtitle="Rate us on the app store"
            onPress={handleRateApp}
          />
          
          <SettingItem
            icon="share"
            title="Share App"
            subtitle="Tell others about Student iReport"
            onPress={handleShareApp}
          />
          
          <SettingItem
            icon="info"
            title="About"
            subtitle="App version and information"
            onPress={showAbout}
          />
        </NeumorphicCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    marginRight: 8,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default SettingsScreen;