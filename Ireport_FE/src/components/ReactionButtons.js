import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {REACTION_TYPES} from '../utils/constants';

const ReactionButtons = ({currentReaction, onReaction, style}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, style]}>
      {REACTION_TYPES.map((reaction) => {
        const isSelected = currentReaction === reaction.key;
        
        return (
          <TouchableOpacity
            key={reaction.key}
            style={[
              styles.reactionButton,
              {
                backgroundColor: isSelected 
                  ? theme.colors.primary 
                  : theme.colors.surface,
                borderColor: isSelected 
                  ? theme.colors.primary 
                  : theme.colors.border,
              },
            ]}
            onPress={() => onReaction(reaction.key)}>
            <Text style={styles.emoji}>{reaction.label}</Text>
            <Text style={[
              styles.reactionText,
              {color: isSelected ? '#ffffff' : theme.colors.text}
            ]}>
              {reaction.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ReactionButtons;