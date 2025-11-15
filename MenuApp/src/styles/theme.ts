import { Platform } from 'react-native';

export const Colors = {
  primary: '#DA6809',
  textPrimary: '#333',
  textSecondary: '#666',
  textMuted: '#999',
  surface: '#FFFFFF',
  surfaceAlt: '#f8f9fa',
  border: '#eee',
  danger: '#E53935',
};

// 根据平台返回合适的字体粗细，Android 上使用更粗的字体
export const getFontWeight = (weight: '400' | '500' | '600' | '700' | 'bold' = '600'): '400' | '500' | '600' | '700' | 'bold' => {
  if (Platform.OS === 'android') {
    // Android 上使用更粗的字体
    switch (weight) {
      case '400':
        return '500';
      case '500':
        return '600';
      case '600':
        return '700';
      case '700':
      case 'bold':
        return 'bold';
      default:
        return '700';
    }
  }
  return weight;
};

export const Spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Typography = {
  h1: { fontSize: 24, fontWeight: getFontWeight('700') as any, color: Colors.textPrimary },
  h2: { fontSize: 18, fontWeight: getFontWeight('600') as any, color: Colors.textPrimary },
  h3: { fontSize: 16, fontWeight: getFontWeight('600') as any, color: Colors.textPrimary },
  body: { fontSize: 14, color: Colors.textSecondary },
  caption: { fontSize: 12, color: Colors.textMuted },
};

export const Buttons = {
  primary: {
    container: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      color: '#fff',
      fontSize: 16,
      fontWeight: getFontWeight('600') as any,
      marginLeft: 8,
    },
  },
  secondary: {
    container: {
      backgroundColor: '#f0f0f0',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      color: Colors.primary,
      fontSize: 14,
      fontWeight: getFontWeight('600') as any,
      marginLeft: 8,
    },
  },
};


