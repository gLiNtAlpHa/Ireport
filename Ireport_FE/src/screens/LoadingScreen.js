import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const LoadingScreen = () => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.text, {color: theme.colors.text}]}>
        Loading Student iReport...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoadingScreen;