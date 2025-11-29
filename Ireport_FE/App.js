import {
  StatusBar,
  LogBox,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {enableScreens} from 'react-native-screens';
import SplashScreen from 'react-native-splash-screen';
import {MenuProvider} from 'react-native-popup-menu';
import NetInfo from '@react-native-netinfo';

// Context Providers
import {AuthProvider} from './src/context/AuthContext';
import {ThemeProvider} from './src/context/ThemeContext';
import {NotificationProvider} from './src/context/NotificationContext';
import {AdminProvider} from './src/context/AdminContext';
import {AppProvider} from './src/context/AppContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Components
import ErrorBoundary from './src/components/UI/ErrorBoundary';

// Services
import {notificationService} from './src/services/notificationService';

// Enable react-native-screens
enableScreens();

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

//  LogBox ignores for production
LogBox.ignoreLogs([
  'Require cycle:',
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'Module RCTImageLoader',
  'Setting a timer',
  'Remote debugger',
  'Animated: `useNativeDriver`',
  'VirtualizedLists should never be nested',
  'Non-serializable values were found in the navigation state',
  'DEPRECATION WARNING',
]);

const App = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Hide splash screen
      setTimeout(() => {
        SplashScreen.hide();
      }, 1000);

      // Setup push notifications
      await setupPushNotifications();

      // Setup network listener
      setupNetworkListener();

      // Setup global error handler
      setupGlobalErrorHandler();

    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const setupPushNotifications = async () => {
    try {
      // Request permission
      const hasPermission = await notificationService.requestPermission();
      
      if (hasPermission) {
        // Get FCM token
        const token = await notificationService.getToken();
        console.log('FCM Token:', token);

        // Handle foreground messages
        const unsubscribeForeground = notificationService.onMessage(
          async (remoteMessage) => {
            console.log('Foreground message:', remoteMessage);
            
            // Show local notification
            Alert.alert(
              remoteMessage.notification?.title || 'Notification',
              remoteMessage.notification?.body || 'You have a new message'
            );
          }
        );

        // Handle notification opened app
        notificationService.onNotificationOpenedApp((remoteMessage) => {
          console.log('Notification opened app:', remoteMessage);
          // Handle navigation based on notification data
        });

        // Check if app was opened from a notification
        const initialNotification = await notificationService.getInitialNotification();
        if (initialNotification) {
          console.log('App opened from notification:', initialNotification);
          // Handle initial notification
        }

        return unsubscribeForeground;
      }
    } catch (error) {
      console.error('Push notification setup error:', error);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Connection type:', state.type);
      console.log('Is connected?', state.isConnected);
      console.log('Is internet reachable?', state.isInternetReachable);
    });

    return unsubscribe;
  };

  const setupGlobalErrorHandler = () => {
    const defaultHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('Global error:', error);
      
      if (__DEV__) {
        // In development, use default handler
        defaultHandler(error, isFatal);
      } else {
        // In production, handle gracefully
        if (isFatal) {
          Alert.alert(
            'Unexpected Error',
            'The app encountered an unexpected error. Please restart the app.',
            [
              {
                text: 'Restart',
                onPress: () => {
                 // implement app restart logic here
                }
              }
            ]
          );
        }
      }
    });
  };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <MenuProvider>
            <ThemeProvider>
              <AuthProvider>
                <NotificationProvider>
                  <AdminProvider>
                    <AppProvider>
                      <StatusBar 
                        translucent 
                        backgroundColor="transparent"
                        barStyle="dark-content"
                      />
                      <AppNavigator />
                    </AppProvider>
                  </AdminProvider>
                </NotificationProvider>
              </AuthProvider>
            </ThemeProvider>
          </MenuProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;