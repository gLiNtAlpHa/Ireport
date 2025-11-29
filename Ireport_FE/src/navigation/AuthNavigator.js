import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useTheme} from '../context/ThemeContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const {theme} = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        cardStyle: {backgroundColor: theme.colors.background},
      }}>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{title: 'Create Account'}}
      />
      <Stack.Screen 
        name="EmailVerification" 
        component={EmailVerificationScreen}
        options={{title: 'Verify Email'}}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{title: 'Reset Password'}}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
        options={{title: 'New Password'}}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;