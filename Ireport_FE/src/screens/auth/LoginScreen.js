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

const LoginScreen = ({navigation}) => {
  const {login} = useAuth();
  const {theme, isDark, toggleTheme} = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigation will be handled by AuthNavigator
    } catch (error) {
      Alert.alert(
        'Login Failed', 
        error.response?.data?.detail || 'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      {/* Theme Toggle */}
      <TouchableOpacity 
        style={styles.themeToggle}
        onPress={toggleTheme}>
        <Icon 
          name={isDark ? 'light-mode' : 'dark-mode'} 
          size={24} 
          color={theme.colors.text} 
        />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            Sign in to continue to Student iReport
          </Text>
        </View>

        <NeumorphicCard style={styles.formCard}>
          <NeumorphicInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <NeumorphicInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon 
                  name={showPassword ? 'visibility-off' : 'visibility'} 
                  size={24} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.forgotPasswordText, {color: theme.colors.primary}]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <NeumorphicButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, {backgroundColor: theme.colors.border}]} />
            <Text style={[styles.dividerText, {color: theme.colors.textSecondary}]}>
              OR
            </Text>
            <View style={[styles.dividerLine, {backgroundColor: theme.colors.border}]} />
          </View>

          <NeumorphicButton
            title="Create New Account"
            onPress={() => navigation.navigate('Register')}
            variant="secondary"
            style={styles.registerButton}
          />
        </NeumorphicCard>

        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: theme.colors.textSecondary}]}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
  },
  registerButton: {
    marginTop: 5,
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;