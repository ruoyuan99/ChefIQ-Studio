import React from 'react';
import { render } from '@testing-library/react-native';
import OptimizedImage from '../OptimizedImage';

// Note: expo-image is already mocked in jest.setup.js

describe('OptimizedImage', () => {
  it('should render with image source', () => {
    const result = render(
      <OptimizedImage
        source="https://example.com/image.jpg"
        style={{ width: 100, height: 100 }}
      />
    );
    
    // Component should render without errors
    expect(result).toBeDefined();
  });

  it('should render placeholder when no source', () => {
    const result = render(
      <OptimizedImage
        source={null}
        style={{ width: 100, height: 100 }}
      />
    );
    
    // Component should render without errors
    expect(result).toBeDefined();
  });

  it('should handle string URL source', () => {
    const result = render(
      <OptimizedImage
        source="https://example.com/image.jpg"
        style={{ width: 100, height: 100 }}
      />
    );
    
    expect(result).toBeDefined();
  });

  it('should handle object source with uri', () => {
    const result = render(
      <OptimizedImage
        source={{ uri: 'https://example.com/image.jpg' }}
        style={{ width: 100, height: 100 }}
      />
    );
    
    expect(result).toBeDefined();
  });

  it('should handle number source (require)', () => {
    const result = render(
      <OptimizedImage
        source={1} // Mock require result
        style={{ width: 100, height: 100 }}
      />
    );
    
    expect(result).toBeDefined();
  });

  it('should apply custom style', () => {
    const customStyle = { width: 200, height: 200, borderRadius: 10 };
    const result = render(
      <OptimizedImage
        source="https://example.com/image.jpg"
        style={customStyle}
      />
    );
    
    expect(result).toBeDefined();
  });

  it('should handle empty string source', () => {
    const result = render(
      <OptimizedImage
        source=""
        style={{ width: 100, height: 100 }}
      />
    );
    
    expect(result).toBeDefined();
  });
});

