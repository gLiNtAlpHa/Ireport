import {logger} from 'react-native-logs';

if (__DEV__) {
  // Flipper network inspector
  require('react-native-flipper').default.addPlugin({
    getId() { return 'NetworkLogger'; },
    onConnect(connection) {
      // Network logging setup
      console.log('Flipper Network Logger connected');
    },
    onDisconnect() {
      console.log('Flipper Network Logger disconnected');
    },
    runInBackground() {
      return false;
    }
  });

  // Enhanced logging for development
  const defaultLog = logger.createLogger({
    severity: __DEV__ ? logger.consoleTransport.levelMap.debug : logger.consoleTransport.levelMap.error,
    transport: __DEV__ ? [logger.consoleTransport, logger.configLoggerType] : [logger.consoleTransport],
    transportOptions: {
      colors: {
        info: 'blueBright',
        warn: 'yellowBright',
        error: 'redBright'
      }
    }
  });

  global.log = defaultLog;
}