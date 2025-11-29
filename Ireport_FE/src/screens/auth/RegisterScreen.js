import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../context/ThemeContext';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicButton from '../../components/UI/NeoButton';
import NeumorphicInput from '../../components/UI/NeoInput';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {validateEmail, validatePassword} from '../../utils/validators';

const RegisterScreen = ({navigation}) => {
  const {register} = useAuth();
  const {theme} = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }
    
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!agreedToTerms) {
      newErrors.terms = 'Please agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register({
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        password: formData.password,
      });
      
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('EmailVerification', {
              email: formData.email,
            }),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.detail || 'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  const PasswordStrengthIndicator = () => {
    const validation = validatePassword(formData.password);
    
    if (!formData.password) return null;
    
    return (
      <View style={styles.passwordStrength}>
        <Text style={[styles.strengthTitle, {color: theme.colors.textSecondary}]}>
          Password Requirements:
        </Text>
        <View style={styles.strengthChecks}>
          <StrengthCheck 
            met={validation.errors.minLength} 
            text="At least 8 characters" 
          />
          <StrengthCheck 
            met={validation.errors.hasUpperCase} 
            text="One uppercase letter" 
          />
          <StrengthCheck 
            met={validation.errors.hasLowerCase} 
            text="One lowercase letter" 
          />
          <StrengthCheck 
            met={validation.errors.hasNumbers} 
            text="One number" 
          />
        </View>
      </View>
    );
  };

  const StrengthCheck = ({met, text}) => (
    <View style={styles.strengthCheck}>
      <Icon 
        name={met ? 'check-circle' : 'radio-button-unchecked'} 
        size={16} 
        color={met ? theme.colors.success : theme.colors.textSecondary} 
      />
      <Text style={[
        styles.strengthText, 
        {color: met ? theme.colors.success : theme.colors.textSecondary}
      ]}>
        {text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            Join Student iReport to start reporting incidents
          </Text>
        </View>

        <NeumorphicCard style={styles.formCard}>
          <NeumorphicInput
            label="Full Name"
            value={formData.full_name}
            onChangeText={(text) => setFormData({...formData, full_name: text})}
            placeholder="Enter your full name"
            error={errors.full_name}
            leftIcon={<Icon name="person" size={20} color={theme.colors.textSecondary} />}
          />

          <NeumorphicInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            leftIcon={<Icon name="email" size={20} color={theme.colors.textSecondary} />}
          />

          <NeumorphicInput
            label="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            placeholder="Create a password"
            secureTextEntry={!showPassword}
            error={errors.password}
            leftIcon={<Icon name="lock" size={20} color={theme.colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon 
                  name={showPassword ? 'visibility-off' : 'visibility'} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            }
          />

          <PasswordStrengthIndicator />

          <NeumorphicInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            error={errors.confirmPassword}
            leftIcon={<Icon name="lock" size={20} color={theme.colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon 
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            }
          />

          {/* Terms Agreement */}
          <TouchableOpacity 
            style={styles.termsContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}>
            <Icon 
              name={agreedToTerms ? 'check-box' : 'check-box-outline-blank'} 
              size={20} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.termsText, {color: theme.colors.text}]}>
              I agree to the{' '}
              <Text style={[styles.linkText, {color: theme.colors.primary}]}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={[styles.linkText, {color: theme.colors.primary}]}>
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>
          
          {errors.terms && (
            <Text style={[styles.errorText, {color: theme.colors.error}]}>
              {errors.terms}
            </Text>
          )}

          <NeumorphicButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.loginLink}>
            <Text style={[styles.loginText, {color: theme.colors.textSecondary}]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, {color: theme.colors.primary}]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </NeumorphicCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
  },
  passwordStrength: {
    marginTop: 8,
    marginBottom: 16,
  },
  strengthTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  strengthChecks: {
    gap: 4,
  },
  strengthCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthText: {
    fontSize: 12,
    marginLeft: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 16,
  },
  termsText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    marginTop: 10,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
});

export default RegisterScreen;