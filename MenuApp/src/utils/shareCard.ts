import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export async function captureCardToPng(componentRef: any, opts?: { width?: number }): Promise<string> {
  const uri = await captureRef(componentRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: opts?.width, // allow high-res export for long cards
  });
  return uri;
}

export async function shareImage(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

export async function saveToPhotos(uri: string): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') return;
  await MediaLibrary.saveToLibraryAsync(uri);
}


