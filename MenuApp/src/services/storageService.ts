import { supabase } from '../config/supabase';
// Use legacy API for Expo SDK 54 compatibility
import * as FileSystem from 'expo-file-system/legacy';
import { compressRecipeImage, compressAvatarImage } from '../utils/imageCompression';

/**
 * Download a remote image to local file system
 * @param remoteUrl - The remote image URL to download
 * @returns Local file URI
 */
export async function downloadRemoteImage(remoteUrl: string): Promise<string> {
  try {
    console.log('📥 [IMAGE DOWNLOAD] Starting download from:', remoteUrl);
    
    // Create a temporary file path
    const filename = remoteUrl.split('/').pop() || 'image.jpg';
    const fileExtension = filename.split('.').pop() || 'jpg';
    const localUri = `${FileSystem.cacheDirectory}downloaded_${Date.now()}.${fileExtension}`;
    
    console.log('📥 [IMAGE DOWNLOAD] Saving to local path:', localUri);
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
    
    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download image: HTTP ${downloadResult.status}`);
    }
    
    console.log('✅ [IMAGE DOWNLOAD] Remote image downloaded successfully');
    console.log('   - Local path:', downloadResult.uri);
    console.log('   - File size:', downloadResult.headers?.['content-length'] || 'unknown', 'bytes');
    
    return downloadResult.uri;
  } catch (error) {
    console.error('❌ [IMAGE DOWNLOAD] Failed to download remote image:', error);
    console.error('   - URL:', remoteUrl);
    throw error;
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = globalThis.atob ? globalThis.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Upload a recipe image to Supabase Storage
 * Supports both local files and remote URLs (will download first)
 * @param imageSource - Local file URI or remote URL
 * @param ownerId - User ID who owns the recipe
 * @param compress - Whether to compress the image before upload
 * @returns Public URL of the uploaded image
 */
export async function uploadRecipeImage(imageSource: string, ownerId: string, compress: boolean = true): Promise<string> {
  try {
    console.log('📤 [IMAGE UPLOAD] Starting upload process');
    console.log('   - Source:', imageSource);
    console.log('   - Owner ID:', ownerId);
    console.log('   - Compress:', compress);
    
    // Check if imageSource is a remote URL
    let imageUri = imageSource;
    const isRemoteUrl = imageSource.startsWith('http://') || imageSource.startsWith('https://');
    
    // If it's a remote URL, download it first
    if (isRemoteUrl) {
      console.log('📥 [IMAGE UPLOAD] Detected remote URL, downloading first...');
      imageUri = await downloadRemoteImage(imageSource);
      console.log('📥 [IMAGE UPLOAD] Download complete, proceeding to upload');
    } else {
      console.log('📤 [IMAGE UPLOAD] Using local file path');
    }
    
    // Compress image before upload (optional, but recommended for better performance)
    if (compress) {
      try {
        imageUri = await compressRecipeImage(imageUri);
        console.log('✅ Image compressed successfully');
      } catch (compressError) {
        console.warn('⚠️ Image compression failed, using original:', compressError);
        // Continue with original image if compression fails
      }
    }

    // Determine extension and content type
    const lower = imageUri.toLowerCase();
    const ext = lower.endsWith('.png') ? 'png' : lower.endsWith('.webp') ? 'webp' : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'jpg' : 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // Build storage path
    const filename = `${Date.now()}.${ext}`;
    const path = `recipes/${ownerId}/${filename}`;
    
    console.log('📤 [IMAGE UPLOAD] Storage path:', path);
    console.log('📤 [IMAGE UPLOAD] Content type:', contentType);

    // In React Native, Response.blob() 可能不可用；改为读取 Base64 并转换为 ArrayBuffer
    // 某些 Expo 版本不暴露 EncodingType.Base64，使用字符串 'base64'
    console.log('📤 [IMAGE UPLOAD] Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' as any });
    const arrayBuffer = base64ToArrayBuffer(base64);
    console.log('📤 [IMAGE UPLOAD] File read, size:', arrayBuffer.byteLength, 'bytes');

    console.log('📤 [IMAGE UPLOAD] Uploading to Supabase Storage...');
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(path, arrayBuffer as any, { contentType, upsert: true });

    if (uploadError) {
      console.error('❌ [IMAGE UPLOAD] Upload error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
    console.log('✅ [IMAGE UPLOAD] Upload successful!');
    console.log('   - Public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (err: any) {
    console.error('Image upload failed:', err);
    throw err;
  }
}

export async function uploadAvatarImage(localUri: string, userId: string, compress: boolean = true): Promise<string> {
  try {
    // Compress image before upload (optional, but recommended for better performance)
    let imageUri = localUri;
    if (compress) {
      try {
        imageUri = await compressAvatarImage(localUri);
        console.log('✅ Avatar image compressed successfully');
      } catch (compressError) {
        console.warn('⚠️ Avatar image compression failed, using original:', compressError);
        // Continue with original image if compression fails
      }
    }

    // Determine extension and content type
    const lower = imageUri.toLowerCase();
    const ext = lower.endsWith('.png') ? 'png' : lower.endsWith('.webp') ? 'webp' : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'jpg' : 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // Build storage path for avatar
    const filename = `${Date.now()}.${ext}`;
    const path = `avatars/${userId}/${filename}`;

    // Read file as base64 and convert to ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' as any });
    const arrayBuffer = base64ToArrayBuffer(base64);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('recipe-images') // Using same bucket, but different folder
      .upload(path, arrayBuffer as any, { contentType, upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
    return data.publicUrl;
  } catch (err: any) {
    console.error('Avatar upload failed:', err);
    throw err;
  }
}
