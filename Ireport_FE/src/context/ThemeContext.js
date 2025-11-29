import React, {createContext, useContext, useState, useEffect} from 'react';
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {lightTheme, darkTheme} from '../styles/theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({children}) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    setTheme(isDark ? darkTheme : lightTheme);
  }, [isDark]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      } else {
        const colorScheme = Appearance.getColorScheme();
        setIsDark(colorScheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const setLightTheme = async () => {
    setIsDark(false);
    await AsyncStorage.setItem('theme_preference', 'light');
  };

  const setDarkTheme = async () => {
    setIsDark(true);
    await AsyncStorage.setItem('theme_preference', 'dark');
  };

  return (
    <ThemeContext.Provider 
      value={{
        theme, 
        isDark, 
        toggleTheme,
        setLightTheme,
        setDarkTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};
