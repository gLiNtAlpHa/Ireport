import React from 'react';
import {TouchableOpacity, Text, ActivityIndicator, Animated} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../context/ThemeContext';
import {createNeumorphicStyle} from '../../styles/neumorphism';

const NeumorphicButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const {theme} = useTheme();
  const [pressed, setPressed] = React.useState(false);
  const animatedValue = React.useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return [theme.colors.primary, theme.colors.secondary];
      case 'secondary':
        return [theme.colors.surface, theme.colors.surface];
      case 'success':
        return ['#10b981', '#059669'];
      case 'warning':
        return ['#f59e0b', '#d97706'];
      case 'error':
        return ['#ef4444', '#dc2626'];
      default:
        return [theme.colors.primary, theme.colors.secondary];
    }
  };

  const getTextColor = () => {
    return variant === 'primary' || variant === 'success' || variant === 'warning' || variant === 'error'
      ? '#ffffff'
      : theme.colors.text;
  };

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(animatedValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const buttonStyle = [
    createNeumorphicStyle(theme, pressed),
    {
      opacity: isDisabled ? 0.6 : 1,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      transform: [{scale: animatedValue}],
    },
    style,
  ];

  return (
    <Animated.View style={buttonStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={{flex: 1, width: '100%'}}
        {...props}>
        <LinearGradient
          colors={getButtonColors()}
          style={{
            flex: 1,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.borderRadius.md,
            flexDirection: 'row',
          }}>
          {loading ? (
            <ActivityIndicator color={getTextColor()} />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <View style={{marginRight: 8}}>{icon}</View>
              )}
              <Text
                style={[
                  {
                    color: getTextColor(),
                    fontSize: 16,
                    fontWeight: '600',
                  },
                  textStyle,
                ]}>
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <View style={{marginLeft: 8}}>{icon}</View>
              )}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default NeumorphicButton;