// Mock dependencies BEFORE imports
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));

import { captureCardToPng, shareImage, saveToPhotos } from '../shareCard';
import * as ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

describe('shareCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('captureCardToPng', () => {
    it('should capture card to PNG', async () => {
      const mockRef = { current: {} };
      const mockUri = 'file:///tmp/card.png';
      
      (ViewShot.captureRef as jest.Mock).mockResolvedValue(mockUri);

      const result = await captureCardToPng(mockRef);
      
      expect(result).toBe(mockUri);
      expect(ViewShot.captureRef).toHaveBeenCalledWith(mockRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: undefined,
      });
    });

    it('should capture with custom width', async () => {
      const mockRef = { current: {} };
      const mockUri = 'file:///tmp/card.png';
      
      (ViewShot.captureRef as jest.Mock).mockResolvedValue(mockUri);

      const result = await captureCardToPng(mockRef, { width: 800 });
      
      expect(result).toBe(mockUri);
      expect(ViewShot.captureRef).toHaveBeenCalledWith(mockRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: 800,
      });
    });
  });

  describe('shareImage', () => {
    it('should share image when sharing is available', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await shareImage('file:///tmp/card.png');
      
      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///tmp/card.png');
    });

    it('should not share when sharing is not available', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      await shareImage('file:///tmp/card.png');
      
      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });
  });

  describe('saveToPhotos', () => {
    it('should save image to photos when permission is granted', async () => {
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (MediaLibrary.saveToLibraryAsync as jest.Mock).mockResolvedValue(undefined);

      await saveToPhotos('file:///tmp/card.png');
      
      expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith('file:///tmp/card.png');
    });

    it('should not save when permission is denied', async () => {
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await saveToPhotos('file:///tmp/card.png');
      
      expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
    });
  });
});

