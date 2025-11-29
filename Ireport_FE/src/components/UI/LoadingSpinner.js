import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../context/ThemeContext';

const LoadingSpinner = ({text = 'Loading...', size = 'large', style}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {text && (
        <Text style={[styles.text, {color: theme.colors.textSecondary}]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
  },
});

export default LoadingSpinner;