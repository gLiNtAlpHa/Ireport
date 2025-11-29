import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {authService} from '../../services/authService';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicButton from '../../components/UI/NeoButton';
import NeumorphicInput from '../../components/UI/NeoInput';
import Icon from 'react-native-vector-icons/MaterialIcons';

const EmailVerificationScreen = ({route, navigation}) => {
  const {email} = route.params || {};
  const {theme} = useTheme();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyEmail(verificationCode.trim());
      
      Alert.alert(
        'Email Verified',
        'Your email has been verified successfully. You can now sign in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error.response?.data?.detail || 'Invalid verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      // In a real app, you'd have a resend verification endpoint
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(60);
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        <NeumorphicCard style={styles.card}>
          {/* Icon */}
          <View style={[styles.iconContainer, {backgroundColor: theme.colors.primary}]}>
            <Icon name="mail-outline" size={48} color="#ffffff" />
          </View>

          {/* Title */}
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Verify Your Email
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            We've sent a verification code to
          </Text>
          <Text style={[styles.email, {color: theme.colors.primary}]}>
            {email}
          </Text>

          {/* Instructions */}
          <Text style={[styles.instructions, {color: theme.colors.textSecondary}]}>
            Enter the 6-digit code from your email to verify your account.
          </Text>

          {/* Verification Code Input */}
          <NeumorphicInput
            label="Verification Code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Icon name="security" size={20} color={theme.colors.textSecondary} />}
          />

          {/* Verify Button */}
          <NeumorphicButton
            title="Verify Email"
            onPress={handleVerification}
            loading={loading}
            style={styles.verifyButton}
          />

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, {color: theme.colors.textSecondary}]}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={countdown > 0 || resendLoading}>
              <Text style={[
                styles.resendLink, 
                {
                  color: countdown > 0 ? theme.colors.textSecondary : theme.colors.primary,
                  opacity: countdown > 0 ? 0.5 : 1,
                }
              ]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.backText, {color: theme.colors.textSecondary}]}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </NeumorphicCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  verifyButton: {
    width: '100%',
    marginTop: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
  },
  backText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EmailVerificationScreen;