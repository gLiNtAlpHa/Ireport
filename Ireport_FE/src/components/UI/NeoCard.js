import React from 'react';
import {View, TouchableOpacity, Animated} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {createNeumorphicStyle} from '../../styles/neumorphism';

const NeumorphicCard = ({
  children,
  style,
  onPress,
  pressable = false,
  animated = false,
  ...props
}) => {
  const {theme} = useTheme();
  const [pressed, setPressed] = React.useState(false);
  const animatedValue = React.useRef(new Animated.Value(1)).current;

  const cardStyle = [
    createNeumorphicStyle(theme, pressed),
    style,
  ];

  const handlePressIn = () => {
    setPressed(true);
    if (animated) {
      Animated.spring(animatedValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    setPressed(false);
    if (animated) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  if (pressable || onPress) {
    const Component = animated ? Animated.View : TouchableOpacity;
    
    return (
      <Component
        style={[
          cardStyle,
          animated && {
            transform: [{scale: animatedValue}],
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={animated ? 1 : 0.9}
        {...props}>
        {children}
      </Component>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

export default NeumorphicCard;
