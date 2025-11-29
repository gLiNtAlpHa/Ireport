import {StyleSheet} from 'react-native';

export const createNeumorphicStyle = (theme, pressed = false, inset = false) => {
  const isLight = theme.colors.background === '#f8fafc';
  
  if (inset) {
    return {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      shadowColor: isLight ? '#ffffff' : '#000000',
      shadowOffset: {
        width: pressed ? -2 : -4,
        height: pressed ? -2 : -4,
      },
      shadowOpacity: isLight ? 0.8 : 0.3,
      shadowRadius: pressed ? 3 : 6,
      elevation: 0,
    };
  }

  return {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    shadowColor: isLight ? '#d1d5db' : '#000000',
    shadowOffset: {
      width: pressed ? 2 : 4,
      height: pressed ? 2 : 4,
    },
    shadowOpacity: pressed ? 0.1 : 0.15,
    shadowRadius: pressed ? 3 : 6,
    elevation: pressed ? 2 : 4,
  };
};

export const neumorphicStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 4,
    padding: 16,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 20,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 0,
  },
  pressed: {
    transform: [{scale: 0.98}],
  },
});
