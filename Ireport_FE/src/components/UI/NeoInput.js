import React from 'react';
import {View, TextInput, Text, Animated} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {createNeumorphicStyle} from '../../styles/neumorphism';

const NeumorphicInput = ({
  label,
  error,
  style,
  inputStyle,
  multiline = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const {theme} = useTheme();
  const [focused, setFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: focused || hasValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused, hasValue, animatedValue]);

  const containerStyle = [
    createNeumorphicStyle(theme, focused),
    {
      borderColor: error
        ? theme.colors.error
        : focused
        ? theme.colors.primary
        : 'transparent',
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      paddingHorizontal: 16,
      paddingVertical: multiline ? 16 : 12,
    },
    style,
  ];

  const labelStyle = {
    position: 'absolute',
    left: leftIcon ? 56 : 16,
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.textSecondary, theme.colors.primary],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [multiline ? 16 : 12, -8],
    }),
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={{marginVertical: theme.spacing.sm}}>
      <View style={containerStyle}>
        {leftIcon && (
          <View style={{marginRight: 12}}>
            {leftIcon}
          </View>
        )}
        
        <View style={{flex: 1}}>
          {label && (
            <Animated.Text style={labelStyle}>
              {label}
            </Animated.Text>
          )}
          
          <TextInput
            style={[
              {
                color: theme.colors.text,
                fontSize: 16,
                padding: 0,
                minHeight: multiline ? 80 : 20,
                textAlignVertical: multiline ? 'top' : 'center',
                marginTop: label && (focused || hasValue) ? 8 : 0,
              },
              inputStyle,
            ]}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChangeText={(text) => {
              setHasValue(text.length > 0);
              props.onChangeText?.(text);
            }}
            placeholderTextColor={theme.colors.textSecondary}
            multiline={multiline}
            {...props}
          />
        </View>
        
        {rightIcon && (
          <View style={{marginLeft: 12}}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text
          style={{
            color: theme.colors.error,
            fontSize: 12,
            marginTop: theme.spacing.xs,
            marginLeft: 4,
          }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default NeumorphicInput;
