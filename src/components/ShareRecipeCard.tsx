import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface ShareRecipeCardProps {
  title: string;
  imageUri?: string | number | null;
  cookingTime?: string;
  servings?: string;
  authorName?: string;
  watermark?: string; // brand watermark text
  cardWidth?: number; // default 1080 for high-res capture
}

const ShareRecipeCard: React.FC<ShareRecipeCardProps> = ({
  title,
  imageUri,
  cookingTime,
  servings,
  authorName,
  watermark = 'Chef iQ',
  cardWidth = 1080,
}) => {
  const imageHeight = Math.round(cardWidth * 0.56); // show ~56% of width (less crop)
  return (
    <View style={[styles.card, { width: cardWidth }]} collapsable={false}>
      <View style={[styles.imageWrapper, { height: imageHeight }] }>
        {imageUri ? (
          <Image
            source={typeof imageUri === 'string' ? { uri: imageUri } : (imageUri as any)}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>{watermark}</Text>
        </View>
      </View>

      <View style={styles.metaSection}>
        <Text numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          {cookingTime ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Time</Text>
              <Text style={styles.metaValue}>{cookingTime}</Text>
            </View>
          ) : null}
          {servings ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Servings</Text>
              <Text style={styles.metaValue}>{servings}</Text>
            </View>
          ) : null}
        </View>
        {authorName ? (
          <Text style={styles.author}>By {authorName}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#f2f2f2',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    backgroundColor: '#fafafa',
  },
  watermarkContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  watermarkText: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metaSection: {
    padding: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#222',
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E8',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 12,
  },
  metaLabel: {
    color: '#FF6B35',
    fontWeight: '700',
    marginRight: 8,
  },
  metaValue: {
    color: '#333',
    fontWeight: '600',
  },
  author: {
    marginTop: 16,
    color: '#666',
    fontSize: 28,
  },
});

export default ShareRecipeCard;


