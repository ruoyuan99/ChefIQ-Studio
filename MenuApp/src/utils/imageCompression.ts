import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  compress?: number; // 0-1, default 0.8
  format?: ImageManipulator.SaveFormat;
  quality?: number; // 0-100, for JPEG
}

/**
 * Compress and resize image for optimization
 * @param uri - Image URI (local file path)
 * @param options - Compression options
 * @returns Compressed image URI
 */
export async function compressImage(
  uri: string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  try {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      compress = 0.8,
      format = ImageManipulator.SaveFormat.JPEG,
    } = options;

    // Get image info to determine if resize is needed
    const manipulator = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress,
        format,
      }
    );

    return manipulator.uri;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original URI if compression fails
    return uri;
  }
}

/**
 * Generate thumbnail from image
 * @param uri - Image URI (local file path)
 * @param size - Thumbnail size (default: 300x300)
 * @returns Thumbnail image URI
 */
export async function generateThumbnail(
  uri: string,
  size: number = 300
): Promise<string> {
  try {
    const manipulator = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: size,
            height: size,
          },
        },
      ],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipulator.uri;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return uri;
  }
}

/**
 * Compress image for recipe upload
 * Optimized for recipe images (recommended: 800x800, 80% quality)
 */
export async function compressRecipeImage(uri: string): Promise<string> {
  return compressImage(uri, {
    maxWidth: 800,
    maxHeight: 800,
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });
}

/**
 * Compress image for avatar upload
 * Optimized for avatar images (recommended: 400x400, 80% quality)
 */
export async function compressAvatarImage(uri: string): Promise<string> {
  return compressImage(uri, {
    maxWidth: 400,
    maxHeight: 400,
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });
}

/**
 * Compress image for thumbnail
 * Optimized for thumbnails (recommended: 300x300, 70% quality)
 */
export async function compressThumbnailImage(uri: string): Promise<string> {
  return compressImage(uri, {
    maxWidth: 300,
    maxHeight: 300,
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  });
}

