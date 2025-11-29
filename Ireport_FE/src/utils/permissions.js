import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';

export const permissions = {
  async requestCamera() {
    if (Platform.OS === 'ios') {
      return true; // iOS handles this automatically
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos for incident reports.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        this.showPermissionAlert('Camera');
      }
      
      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  },

  async requestStorage() {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to your storage to select and save files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        this.showPermissionAlert('Storage');
      }
      
      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  },

  showPermissionAlert(permissionName) {
    Alert.alert(
      `${permissionName} Permission Required`,
      `Please enable ${permissionName.toLowerCase()} permission in app settings to use this feature.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  },
};