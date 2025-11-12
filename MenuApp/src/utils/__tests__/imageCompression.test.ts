import * as ImageManipulator from 'expo-image-manipulator';
import { compressImage, compressRecipeImage, compressAvatarImage, compressThumbnailImage, generateThumbnail } from '../imageCompression';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
}));

describe('imageCompression', () => {
  const mockUri = 'file:///test/image.jpg';
  const mockManipulatedUri = 'file:///test/compressed.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
    (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
      uri: mockManipulatedUri,
    });
  });

  describe('compressImage', () => {
    it('should compress image with default options', async () => {
      const result = await compressImage(mockUri);
      
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [
          {
            resize: {
              width: 1200,
              height: 1200,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      expect(result).toBe(mockManipulatedUri);
    });

    it('should compress image with custom options', async () => {
      const result = await compressImage(mockUri, {
        maxWidth: 800,
        maxHeight: 800,
        compress: 0.7,
        format: ImageManipulator.SaveFormat.PNG,
      });
      
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [
          {
            resize: {
              width: 800,
              height: 800,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.PNG,
        }
      );
      expect(result).toBe(mockManipulatedUri);
    });

    it('should return original URI on compression failure', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(new Error('Compression failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await compressImage(mockUri);
      
      expect(result).toBe(mockUri);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Image compression failed:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('compressRecipeImage', () => {
    it('should compress recipe image with correct options', async () => {
      const result = await compressRecipeImage(mockUri);
      
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [
          {
            resize: {
              width: 800,
              height: 800,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      expect(result).toBe(mockManipulatedUri);
    });
  });

  describe('compressAvatarImage', () => {
    it('should compress avatar image with correct options', async () => {
      const result = await compressAvatarImage(mockUri);
      
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [
          {
            resize: {
              width: 400,
              height: 400,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      expect(result).toBe(mockManipulatedUri);
    });
  });

  describe('compressThumbnailImage', () => {
    it('should compress thumbnail image with correct options', async () => {
      const result = await compressThumbnailImage(mockUri);
      
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [
          {
            resize: {
              width: 300,
              height: 300,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      expect(result).toBe(mockManipulatedUri);
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail with default size', async () => {
      const result = await generateThumbnail(mockUri);
      
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [
          {
            resize: {
              width: 300,
              height: 300,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      expect(result).toBe(mockManipulatedUri);
    });

    it('should generate thumbnail with custom size', async () => {
      const result = await generateThumbnail(mockUri, 200);
      
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [
          {
            resize: {
              width: 200,
              height: 200,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      expect(result).toBe(mockManipulatedUri);
    });

    it('should return original URI on thumbnail generation failure', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(new Error('Thumbnail generation failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await generateThumbnail(mockUri);
      
      expect(result).toBe(mockUri);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Thumbnail generation failed:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});

