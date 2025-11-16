import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface RecipeImagePlaceholderProps {
  title: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * RecipeImagePlaceholder - 菜谱图片占位符组件
 * 显示橙色背景、白色文字的菜谱名称占位图
 */
const RecipeImagePlaceholder: React.FC<RecipeImagePlaceholderProps> = ({ title, style }) => {
  // 处理长标题：如果标题太长，进行换行处理
  const displayTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
  
  // 将标题分成多行显示（每行最多15个字符）
  const words = displayTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach((word, index) => {
    if (currentLine.length + word.length + 1 <= 20) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
    
    // 如果是最后一个词，添加到当前行
    if (index === words.length - 1 && currentLine) {
      lines.push(currentLine);
    }
  });
  
  // 限制最多显示2行
  const displayLines = lines.slice(0, 2);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {displayLines.map((line, index) => (
          <Text key={index} style={styles.text} numberOfLines={1}>
            {line}
          </Text>
        ))}
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
    paddingVertical: 8,
  },
  text: {
    color: '#ffffff', // 白色文字
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
});

export default RecipeImagePlaceholder;

