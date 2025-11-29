import {AppRegistry, LogBox} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';

// Ignore specific warnings that are known issues
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Require cycle:',
  'Warning: componentWillReceiveProps',
  'Animated: `useNativeDriver`',
  'VirtualizedLists should never be nested',
]);

// Enable Flipper for debug builds
if (__DEV__) {
  import('./flipperSetup').then(() => console.log('Flipper Configured'));
}

// Background message handler for FCM
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

// Register the app
AppRegistry.registerComponent(appName, () => App);