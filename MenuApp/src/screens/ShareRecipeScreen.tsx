import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Share,
  Clipboard,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe } from '../contexts/RecipeContext';
import { supabase } from '../config/supabase';
import { sampleRecipes } from '../data/sampleRecipes';
import ShareRecipeCard from '../components/ShareRecipeCard';
import ShareRecipeContent from '../components/ShareRecipeContent';
import { captureCardToPng, saveToPhotos, shareImage } from '../utils/shareCard';

interface ShareRecipeScreenProps {
  navigation: any;
  route: any;
}

const ShareRecipeScreen: React.FC<ShareRecipeScreenProps> = ({
  navigation,
  route,
}) => {
  const { getRecipeById, updateRecipe } = useRecipe();
  const recipeId = route.params.recipeId;
  const initialRecipe = getRecipeById(recipeId);
  const [recipe, setRecipe] = useState<any>(initialRecipe || null);
  const [shareCode, setShareCode] = useState(initialRecipe?.shareCode || '');
  const [loading, setLoading] = useState(!initialRecipe);
  const cardRef = useRef<View>(null);
  const screenWidth = Dimensions.get('window').width;

  // Fallback: If recipe not in context (e.g., opened from cloud), fetch minimal data from Supabase
  useEffect(() => {
    const load = async () => {
      if (recipe) { setLoading(false); return; }
      // Support sample recipes (id starts with sample_)
      if (typeof recipeId === 'string' && recipeId.startsWith('sample_')) {
        const s = sampleRecipes.find(r => r.id === recipeId);
        if (s) {
          setRecipe({
            id: s.id,
            title: s.title,
            description: s.description,
            imageUri: (s as any).image_url || (s as any).imageUri || (s as any).image || null,
            cookingTime: s.cookingTime,
            servings: s.servings,
            authorName: (s as any).authorName,
            authorAvatar: (s as any).authorAvatar,
            tags: (s as any).tags || [],
            ingredients: (s as any).ingredients || [],
            instructions: (s as any).instructions || [],
            cookware: (s as any).cookware || '',
          });
          setLoading(false);
          return;
        }
      }
      setLoading(true);
      const { data } = await supabase
        .from('recipes')
        .select(`
          id,title,description,image_url,cooking_time,servings,cookware,
          ingredients:ingredients(name,amount,unit,order_index),
          instructions:instructions(step_number,description,order_index),
          tags:tags(name)
        `)
        .eq('id', recipeId)
        .maybeSingle();
      if (data) {
        setRecipe({
          id: data.id,
          title: data.title,
          description: data.description,
          image_url: (data as any).image_url,
          cookingTime: (data as any).cooking_time,
          servings: String((data as any).servings ?? ''),
          cookware: (data as any).cookware || '',
          tags: ((data as any).tags || []).map((t: any) => t.name),
          ingredients: ((data as any).ingredients || [])
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((ing: any) => ({ name: ing.name, amount: ing.amount, unit: ing.unit })),
          instructions: ((data as any).instructions || [])
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((ins: any, i: number) => ({ step: ins.step_number || i + 1, description: ins.description })),
        });
      }
      setLoading(false);
    };
    load();
  }, [recipeId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#FF6B35" />
          <Text style={{ marginTop: 8, color: '#666' }}>Loading recipe…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recipe not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const generateShareCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setShareCode(code);
    updateRecipe({ ...recipe, shareCode: code });
  };

  const copyShareCode = () => {
    Clipboard.setString(shareCode);
    Alert.alert('已复制', '分享码已复制到剪贴板');
  };

  const shareMenu = async () => {
    try {
      if (!cardRef.current) return;
      const uri = await captureCardToPng(cardRef.current, { width: Math.round(Dimensions.get('window').width * 2) });
      await shareImage(uri);
    } catch (error) {
      Alert.alert('Share Failed', 'Unable to share the image');
    }
  };

  const shareAsText = () => {
    const textContent = `${recipe.title}\n\n${recipe.description}\n\n菜品列表:\n${recipe.items
      .filter((item: any) => item.isAvailable)
      .map((item: any) => `• ${item.name} - ¥${item.price}`)
      .join('\n')}`;
    
    Clipboard.setString(textContent);
    Alert.alert('已复制', '菜单内容已复制到剪贴板');
  };

  const shareAsQR = () => {
    Alert.alert('二维码分享', '二维码功能需要额外配置，当前版本暂不支持');
  };

  const saveCardImage = async () => {
    try {
      if (!cardRef.current) {
        Alert.alert('Error', 'Unable to capture image. Please try again.');
        return;
      }
      
      const uri = await captureCardToPng(cardRef.current, { width: Math.round(Dimensions.get('window').width * 2) });
      
      if (!uri) {
        Alert.alert('Error', 'Failed to generate image. Please try again.');
        return;
      }
      
      await saveToPhotos(uri);
      Alert.alert('Saved', 'Image saved to Photos successfully!');
    } catch (e: any) {
      console.error('Save image error:', e);
      const errorMessage = e?.message || 'Unknown error';
      
      if (errorMessage.includes('Permission')) {
        // Permission error is already handled in saveToPhotos
        return;
      }
      
      Alert.alert(
        'Save Failed', 
        `Unable to save image to Photos. ${errorMessage}\n\nPlease make sure you have granted storage permissions.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Action bar above the card */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#d96709' }]} onPress={shareMenu}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4CAF50' }]} onPress={saveCardImage}>
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.shareCardContainer}>
          <View ref={cardRef} collapsable={false}>
            <ShareRecipeContent
              width={Math.round(screenWidth * 0.95)}
              title={recipe.title}
              imageUri={recipe.image_url || recipe.imageUri}
              cookingTime={recipe.cookingTime}
              servings={recipe.servings}
              authorName={recipe.authorName}
              description={recipe.description}
              tags={recipe.tags || []}
              ingredients={recipe.ingredients || []}
              instructions={recipe.instructions || []}
              cookware={recipe.cookware}
              logoSource={require('../../assets/AppLogo.png')}
            />
          </View>
        </View>
        {/* Removed duplicate info card below the share content */}

        {/* Removed: share code and other option blocks */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  actionBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  menuPreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  menuStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  shareCodeSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  shareCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareCodeDisplay: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  shareCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  shareOptions: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shareOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  shareOptionInfo: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shareOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  tipsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareCardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default ShareRecipeScreen;
