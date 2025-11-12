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

export const Spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Typography = {
  h1: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  h2: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  h3: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
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
      fontWeight: '600' as const,
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
      fontWeight: '600' as const,
      marginLeft: 8,
    },
  },
};


