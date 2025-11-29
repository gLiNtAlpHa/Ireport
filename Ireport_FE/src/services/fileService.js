import api from './api';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {Alert, Platform} from 'react-native';
import RNFS from 'react-native-fs';


export const fileService = {
  async uploadFile(file, folder = 'general') {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.fileName || file.name || 'file',
    });
    formData.append('folder', folder);
    const response = await api.post('/files/upload', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return response.data;
  },

  getFileUrl(filePath) {
    return `${API_BASE_URL}/uploads/${filePath}`;
  },

  // Image Picker Utilities (unchanged)
  showImagePicker() {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          {text: 'Camera', onPress: () => this.openCamera(resolve, reject)},
          {text: 'Gallery', onPress: () => this.openGallery(resolve, reject)},
          {text: 'Cancel', style: 'cancel', onPress: () => resolve(null)},
        ]
      );
    });
  },

  openCamera(resolve, reject) {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
    };
    launchCamera(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        resolve(null);
      } else if (response.assets && response.assets[0]) {
        resolve(response.assets[0]);
      } else {
        reject(new Error('Failed to capture image'));
      }
    });
  },

  openGallery(resolve, reject) {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
      selectionLimit: 1,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        resolve(null);
      } else if (response.assets && response.assets[0]) {
        resolve(response.assets[0]);
      } else {
        reject(new Error('Failed to select image'));
      }
    });
  },

  async pickDocument() {
    try {
      if (Platform.OS === 'android') {
        return await this.pickDocumentAndroid();
      } else {
        return await this.pickDocumentIOS();
      }
    } catch (error) {
      console.error('Document picker error:', error);
      throw error;
    }
  },

  async pickDocumentAndroid() {
    try {
      const options = {
        mediaType: 'mixed',
        quality: 1,
        includeBase64: false,
      };

      return new Promise((resolve, reject) => {
        launchImageLibrary(options, async (response) => {
          if (response.didCancel) {
            resolve(null);
            return;
          }
          
          if (response.errorMessage) {
            reject(new Error(response.errorMessage));
            return;
          }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            
            // Check if it's a supported document type
            const supportedTypes = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain'
            ];

            if (supportedTypes.includes(asset.type)) {
              resolve({
                uri: asset.uri,
                type: asset.type,
                name: asset.fileName || asset.originalFilename || 'document',
                size: asset.fileSize,
              });
            } else {
              reject(new Error('Unsupported file type. Please select PDF, DOC, DOCX, or TXT files.'));
            }
          } else {
            reject(new Error('Failed to select document'));
          }
        });
      });
    } catch (error) {
      throw new Error('Failed to pick document: ' + error.message);
    }
  },

  async pickDocumentIOS() {
    return this.pickDocumentAndroid();
  },

  async showDocumentPicker() {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Select Document',
        'Choose document type',
        [
          {
            text: 'PDF/Document', 
            onPress: () => this.pickDocumentFromGallery(resolve, reject)
          },
          {
            text: 'Cancel', 
            style: 'cancel', 
            onPress: () => resolve(null)
          },
        ]
      );
    });
  },

  pickDocumentFromGallery(resolve, reject) {
    const options = {
      mediaType: 'mixed',
      quality: 1,
      includeBase64: false,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        resolve(null);
        return;
      }
      
      if (response.errorMessage) {
        reject(new Error(response.errorMessage));
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        resolve({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'document',
          size: asset.fileSize,
        });
      } else {
        reject(new Error('Failed to select document'));
      }
    });
  },

  // File validation (unchanged)
  validateImage(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (file.fileSize > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and GIF images are allowed');
    }
    
    return true;
  },

  validateDocument(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF, DOC, DOCX, and TXT files are allowed');
    }
    
    return true;
  },

  // Utility method to read file content if needed
  async readFileContent(filePath) {
    try {
      const content = await RNFS.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      throw new Error('Failed to read file: ' + error.message);
    }
  },

  // Utility method to copy file to app directory
  async copyFileToAppDirectory(sourceUri, fileName) {
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.copyFile(sourceUri, destPath);
      return destPath;
    } catch (error) {
      throw new Error('Failed to copy file: ' + error.message);
    }
  },
};