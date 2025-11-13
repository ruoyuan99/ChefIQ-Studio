import React, { useState } from 'react';
import { Image, ImageProps, ImageContentFit } from 'expo-image';
import { View, StyleSheet, ActivityIndicator, ViewStyle, ImageStyle } from 'react-native';

export interface OptimizedImageProps extends Omit<ImageProps, 'source' | 'style'> {
  source: string | number | { uri: string } | null | undefined;
  style?: ViewStyle | ImageStyle | (ViewStyle | ImageStyle)[];
  placeholder?: string | number;
  showLoader?: boolean;
  contentFit?: ImageContentFit;
  transition?: number;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  priority?: 'low' | 'normal' | 'high';
  recyclingKey?: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

/**
 * OptimizedImage component with caching, placeholder, and loading states
 * Uses expo-image for better performance and built-in caching
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  showLoader = true,
  contentFit = 'cover',
  transition = 200,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  recyclingKey,
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle source conversion
  const imageSource = React.useMemo(() => {
    if (!source) return null;
    
    if (typeof source === 'string') {
      // Empty string check
      if (source.trim() === '') return null;
      
      // String URL or local path
      if (source.startsWith('http://') || 
          source.startsWith('https://') || 
          source.startsWith('file://') ||
          source.startsWith('data:') ||
          source.startsWith('content://') ||
          source.startsWith('/')) {
        return { uri: source };
      }
      
      // For other strings, try as URI (might be local path)
      return { uri: source };
    }
    
    if (typeof source === 'number') {
      // Local require resource
      return source;
    }
    
    // Object with uri or other properties
    if (source && typeof source === 'object') {
      // Check if it's an object with uri property
      if ('uri' in source) {
        return source;
      }
      // Otherwise, might be a require() result or other image source
      return source;
    }
    
    return null;
  }, [source]);

  // Handle placeholder
  const placeholderSource = React.useMemo(() => {
    if (placeholder) {
      if (typeof placeholder === 'string') {
        return { blurhash: placeholder };
      }
      return placeholder;
    }
    // Default placeholder - gray background
    return null;
  }, [placeholder]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoadEnd?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  };

  // If no source, show placeholder
  if (!imageSource) {
    return (
      <View style={[styles.container, styles.placeholderContainer, style]}>
        {showLoader && (
          <ActivityIndicator size="small" color="#d96709" />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFillObject}
        contentFit={contentFit}
        transition={transition}
        cachePolicy={cachePolicy}
        priority={priority}
        recyclingKey={recyclingKey}
        placeholder={placeholderSource}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...props}
      />
      {isLoading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#d96709" />
        </View>
      )}
      {hasError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d0d0d0',
  },
});

export default OptimizedImage;

