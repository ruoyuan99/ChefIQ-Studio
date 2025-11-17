import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface IngredientItem {
  id?: string;
  name: string;
  amount?: number | string;
  unit?: string;
}

interface InstructionItem {
  id?: string;
  step?: number;
  description: string;
  imageUri?: string | null;
}

interface ShareRecipeContentProps {
  width: number; // desired render width
  title: string;
  imageUri?: string | number | null;
  cookingTime?: string;
  servings?: string;
  authorName?: string;
  description?: string;
  tags?: string[];
  ingredients?: IngredientItem[];
  instructions?: InstructionItem[];
  cookware?: string;
  logoSource?: any; // optional brand logo (require or { uri })
  // qrSource?: any;   // deprecated
}

/**
 * Format cooking time to "x minutes" format
 * Handles various input formats: "15分钟" (Chinese minutes), "15 min", "15", etc.
 */
const formatCookingTime = (cookingTime: string | undefined | null): string => {
  if (!cookingTime) return '';
  
  // Remove Chinese "分钟", "min", "minutes" and extract number
  const cleaned = cookingTime.replace(/分钟|min|minutes/gi, '').trim();
  const parsed = parseInt(cleaned, 10);
  if (!isNaN(parsed)) {
    return `${parsed} minutes`;
  }
  
  // If no number found, try to extract any number from the string
  const numberMatch = cookingTime.match(/\d+/);
  if (numberMatch) {
    return `${numberMatch[0]} minutes`;
  }
  
  // If it's already in "x minutes" format, return as is
  if (cookingTime.toLowerCase().includes('minute')) {
    return cookingTime;
  }
  
  // Fallback: return as is
  return cookingTime;
};

const ShareRecipeContent: React.FC<ShareRecipeContentProps> = ({
  width,
  title,
  imageUri,
  cookingTime,
  servings,
  authorName,
  description,
  tags = [],
  ingredients = [],
  instructions = [],
  cookware,
  logoSource,
  qrSource,
}: ShareRecipeContentProps & { qrSource?: any }) => {
  const imageHeight = Math.round(width * 0.56);
  return (
    <View style={[styles.card, { width }]} collapsable={false}>
      {/* Image */}
      <View style={[styles.imageWrapper, { height: imageHeight }] }>
        {imageUri ? (
          <Image
            source={typeof imageUri === 'string' ? { uri: imageUri } : (imageUri as any)}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
      </View>

      {/* Title & Meta */}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          {cookingTime ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Time</Text>
              <Text style={styles.metaValue}>{formatCookingTime(cookingTime)}</Text>
            </View>
          ) : null}
          {servings ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Servings</Text>
              <Text style={styles.metaValue}>{servings}</Text>
            </View>
          ) : null}
        </View>
        {authorName ? <Text style={styles.author}>By {authorName}</Text> : null}

        {/* Cookware */}
        {cookware ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cookware</Text>
            <Text style={styles.paragraph}>{cookware}</Text>
          </View>
        ) : null}

        {/* Description */}
        {description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.paragraph}>{description}</Text>
          </View>
        ) : null}

        {/* Tags */}
        {tags.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {tags.map((t, idx) => (
                <View style={styles.tag} key={`${t}-${idx}`}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Ingredients */}
        {ingredients.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredients.map((ing, idx) => (
              <Text style={styles.listItem} key={ing.id || String(idx)}>
                • {ing.name}
                {ing.amount ? `  ${ing.amount}` : ''}
                {ing.unit ? ` ${ing.unit}` : ''}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Instructions */}
        {instructions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {instructions.map((step, idx) => (
              <View style={styles.stepItem} key={step.id || String(idx)}>
                <Text style={styles.stepNum}>{(step.step || idx + 1).toString().padStart(2, '0')}</Text>
                <Text style={styles.stepText}>{step.description}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Brand Footer */}
        {logoSource ? (
          <View style={styles.brandFooter}>
            <View style={styles.brandLogoWrap}>
              <Image source={logoSource} style={styles.brandLogo} />
            </View>
            <View style={styles.brandCaptionWrap}>
              <Text style={styles.brandCaption}>
                Generated with Chef iQ Studio — download the app and become a recipe creator!
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#eee',
  },
  imageWrapper: {
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
  body: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E8',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 8,
  },
  metaLabel: {
    color: '#d96709',
    fontWeight: '700',
    marginRight: 6,
  },
  metaValue: {
    color: '#333',
    fontWeight: '600',
  },
  author: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  paragraph: {
    color: '#444',
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F2F6FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#3B6DFF',
    fontWeight: '600',
    fontSize: 12,
  },
  listItem: {
    color: '#333',
    marginBottom: 6,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNum: {
    width: 28,
    color: '#d96709',
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: '#333',
  },
  brandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  brandLogoWrap: {
    flex: 3, // 30%
    alignItems: 'flex-start',
    paddingRight: 12,
  },
  brandCaptionWrap: {
    flex: 7, // 70%
  },
  brandLogo: {
    width: '100%',
    height: 64,
    resizeMode: 'contain',
    opacity: 0.95,
  },
  brandCaption: {
    color: '#666',
    fontSize: 12,
    textAlign: 'left',
  },
});

export default ShareRecipeContent;


