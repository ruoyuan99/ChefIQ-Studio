import { supabase } from '../config/supabase';
// Use legacy API for Expo SDK 54 compatibility
import * as FileSystem from 'expo-file-system/legacy';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = globalThis.atob ? globalThis.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function uploadRecipeImage(localUri: string, ownerId: string): Promise<string> {
  try {
    // Determine extension and content type
    const lower = localUri.toLowerCase();
    const ext = lower.endsWith('.png') ? 'png' : lower.endsWith('.webp') ? 'webp' : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'jpg' : 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // Build storage path
    const filename = `${Date.now()}.${ext}`;
    const path = `recipes/${ownerId}/${filename}`;

    // In React Native, Response.blob() 可能不可用；改为读取 Base64 并转换为 ArrayBuffer
    // 某些 Expo 版本不暴露 EncodingType.Base64，使用字符串 'base64'
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' as any });
    const arrayBuffer = base64ToArrayBuffer(base64);

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(path, arrayBuffer as any, { contentType, upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
    return data.publicUrl;
  } catch (err: any) {
    console.error('Image upload failed:', err);
    throw err;
  }
}

export async function uploadAvatarImage(localUri: string, userId: string): Promise<string> {
  try {
    // Determine extension and content type
    const lower = localUri.toLowerCase();
    const ext = lower.endsWith('.png') ? 'png' : lower.endsWith('.webp') ? 'webp' : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'jpg' : 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // Build storage path for avatar
    const filename = `${Date.now()}.${ext}`;
    const path = `avatars/${userId}/${filename}`;

    // Read file as base64 and convert to ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' as any });
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
