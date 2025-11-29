import {useState, useEffect} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState({
    camera: false,
    storage: false,
    location: false,
  });

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissions(prev => ({...prev, camera: hasPermission}));
        return hasPermission;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to save and read files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissions(prev => ({...prev, storage: hasPermission}));
        return hasPermission;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  return {
    permissions,
    requestCameraPermission,
    requestStoragePermission,
  };
};
