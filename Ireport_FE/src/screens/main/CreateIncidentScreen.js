import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useApp} from '../../context/AppContext';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicButton from '../../components/UI/NeoButton';
import NeumorphicInput from '../../components/UI/NeoInput';
import {fileService} from '../../services/fileService';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {INCIDENT_CATEGORIES} from '../../utils/constants';

const CreateIncidentScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {createIncident} = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePicker = async () => {
    try {
      const selectedImage = await fileService.showImagePicker();
      if (selectedImage) {
        fileService.validateImage(selectedImage);
        setImage(selectedImage);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await createIncident(formData, image);
      
      Alert.alert(
        'Success',
        'Incident reported successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to create incident'
      );
    } finally {
      setLoading(false);
    }
  };

  const CategorySelector = () => (
    <View style={styles.categoryContainer}>
      <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
        Category
      </Text>
      <View style={styles.categoryGrid}>
        {INCIDENT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryCard,
              {
                backgroundColor: formData.category === category.key 
                  ? theme.colors.primary 
                  : theme.colors.surface,
                borderColor: formData.category === category.key
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            onPress={() => setFormData({...formData, category: category.key})}>
            <View style={[
              styles.categoryIcon,
              {backgroundColor: category.color}
            ]}>
              <Text style={styles.categoryEmoji}>
                {getCategoryEmoji(category.key)}
              </Text>
            </View>
            <Text style={[
              styles.categoryLabel,
              {
                color: formData.category === category.key 
                  ? '#ffffff' 
                  : theme.colors.text
              }
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.category && (
        <Text style={[styles.errorText, {color: theme.colors.error}]}>
          {errors.category}
        </Text>
      )}
    </View>
  );

  const ImageSection = () => (
    <View style={styles.imageSection}>
      <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
        Add Photo (Optional)
      </Text>
      
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{uri: image.uri}} style={styles.selectedImage} />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={removeImage}>
            <Icon name="close" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.imagePicker, {borderColor: theme.colors.border}]}
          onPress={handleImagePicker}>
          <Icon name="add-a-photo" size={32} color={theme.colors.textSecondary} />
          <Text style={[styles.imagePickerText, {color: theme.colors.textSecondary}]}>
            Tap to add photo
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        
        <NeumorphicCard style={styles.formCard}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Report New Incident
          </Text>
          
          <NeumorphicInput
            label="Title"
            value={formData.title}
            onChangeText={(text) => setFormData({...formData, title: text})}
            placeholder="Brief description of the incident"
            error={errors.title}
            maxLength={200}
          />

          <NeumorphicInput
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            placeholder="Provide detailed information about what happened"
            multiline
            error={errors.description}
            maxLength={2000}
          />

          <CategorySelector />

          <NeumorphicInput
            label="Location (Optional)"
            value={formData.location}
            onChangeText={(text) => setFormData({...formData, location: text})}
            placeholder="Where did this happen?"
            leftIcon={<Icon name="location-on" size={20} color={theme.colors.textSecondary} />}
            maxLength={100}
          />

          <ImageSection />

          <View style={styles.buttonContainer}>
            <NeumorphicButton
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.cancelButton}
            />
            
            <NeumorphicButton
              title="Submit Report"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </NeumorphicCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getCategoryEmoji = (category) => {
  const emojis = {
    damages: '🔨',
    lost_and_found: '🔍',
    accidents: '⚠️',
    environmental_hazards: '🌿',
    notices_suggestions: '💡',
    complaints: '📢',
  };
  return emojis[category] || '📝';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: 20,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryContainer: {
    marginVertical: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  imageSection: {
    marginVertical: 16,
  },
  imagePicker: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
  },
  imageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 0.45,
  },
  submitButton: {
    flex: 0.45,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default CreateIncidentScreen;
