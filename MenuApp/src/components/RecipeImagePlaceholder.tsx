import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface RecipeImagePlaceholderProps {
  title: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * RecipeImagePlaceholder - Recipe image placeholder component
 * Displays recipe name placeholder with orange background and white text
 * Supports automatic word wrapping to ensure all text is displayed
 */
const RecipeImagePlaceholder: React.FC<RecipeImagePlaceholderProps> = ({ title, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text 
          style={styles.text} 
          numberOfLines={0}
          ellipsizeMode="tail"
          allowFontScaling={true}
        >
          {title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#d96709', // Orange background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    flex: 1,
  },
  text: {
    color: '#ffffff', // White text
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    width: '100%',
  },
});

export default RecipeImagePlaceholder;

