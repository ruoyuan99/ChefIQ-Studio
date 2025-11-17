import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface RecipeImagePlaceholderProps {
  title: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * RecipeImagePlaceholder - 菜谱图片占位符组件
 * 显示橙色背景、白色文字的菜谱名称占位图
 * 支持自动换行，确保所有文字都能显示
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
    backgroundColor: '#d96709', // 橙色背景
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
    color: '#ffffff', // 白色文字
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    width: '100%',
  },
});

export default RecipeImagePlaceholder;

