import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import NeumorphicButton from './NeumorphicButton';
import Icon from 'react-native-vector-icons/MaterialIcons';

const EmptyState = ({
  icon = 'inbox',
  title = 'No Data Found',
  subtitle = 'There\'s nothing here yet',
  buttonTitle,
  onButtonPress,
  style,
}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Icon name={icon} size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.title, {color: theme.colors.text}]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
        {subtitle}
      </Text>
      {buttonTitle && onButtonPress && (
        <NeumorphicButton
          title={buttonTitle}
          onPress={onButtonPress}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 24,
  },
});

export default EmptyState;