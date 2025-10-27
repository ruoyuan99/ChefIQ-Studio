import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe } from '../contexts/RecipeContext';

interface ShareRecipeScreenProps {
  navigation: any;
  route: any;
}

const ShareRecipeScreen: React.FC<ShareRecipeScreenProps> = ({
  navigation,
  route,
}) => {
  const { getRecipeById, updateRecipe } = useRecipe();
  const recipe = getRecipeById(route.params.recipeId);
  const [shareCode, setShareCode] = useState(recipe?.shareCode || '');

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
      const shareContent = {
        title: recipe.title,
        message: `查看我的菜单: ${recipe.title}\n\n${recipe.description}\n\n分享码: ${shareCode}\n\n菜品列表:\n${recipe.items
          .filter(item => item.isAvailable)
          .map(item => `• ${item.name} - ¥${item.price}`)
          .join('\n')}`,
      };
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('分享失败', '无法分享菜单');
    }
  };

  const shareAsText = () => {
    const textContent = `${recipe.title}\n\n${recipe.description}\n\n菜品列表:\n${recipe.items
      .filter(item => item.isAvailable)
      .map(item => `• ${item.name} - ¥${item.price}`)
      .join('\n')}`;
    
    Clipboard.setString(textContent);
    Alert.alert('已复制', '菜单内容已复制到剪贴板');
  };

  const shareAsQR = () => {
    Alert.alert('二维码分享', '二维码功能需要额外配置，当前版本暂不支持');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Menu</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuPreview}>
          <Text style={styles.menuTitle}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.menuDescription}>{recipe.description}</Text>
          )}
          <View style={styles.menuStats}>
            <View style={styles.statItem}>
              <Ionicons name="restaurant" size={16} color="#666" />
              <Text style={styles.statText}>{recipe.items.length} items</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={16} color="#666" />
              <Text style={styles.statText}>
                {recipe.isPublic ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.shareCodeSection}>
          <Text style={styles.sectionTitle}>分享码</Text>
          <View style={styles.shareCodeContainer}>
            <View style={styles.shareCodeDisplay}>
              <Text style={styles.shareCodeText}>
                {shareCode || '点击生成分享码'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateShareCode}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.generateButtonText}>生成</Text>
            </TouchableOpacity>
          </View>
          {shareCode && (
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyShareCode}
            >
              <Ionicons name="copy-outline" size={20} color="#2196F3" />
              <Text style={styles.copyButtonText}>复制分享码</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.shareOptions}>
          <Text style={styles.sectionTitle}>分享方式</Text>
          
          <TouchableOpacity style={styles.shareOption} onPress={shareMenu}>
            <View style={styles.shareOptionContent}>
              <View style={[styles.shareIcon, { backgroundColor: '#FF6B35' }]}>
                <Ionicons name="share-outline" size={24} color="white" />
              </View>
              <View style={styles.shareOptionInfo}>
                <Text style={styles.shareOptionTitle}>系统分享</Text>
                <Text style={styles.shareOptionDescription}>
                  通过系统分享功能发送到其他应用
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={shareAsText}>
            <View style={styles.shareOptionContent}>
              <View style={[styles.shareIcon, { backgroundColor: '#FF6B35' }]}>
                <Ionicons name="document-text-outline" size={24} color="white" />
              </View>
              <View style={styles.shareOptionInfo}>
                <Text style={styles.shareOptionTitle}>复制文本</Text>
                <Text style={styles.shareOptionDescription}>
                  复制菜单内容到剪贴板
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={shareAsQR}>
            <View style={styles.shareOptionContent}>
              <View style={[styles.shareIcon, { backgroundColor: '#FF6B35' }]}>
                <Ionicons name="qr-code-outline" size={24} color="white" />
              </View>
              <View style={styles.shareOptionInfo}>
                <Text style={styles.shareOptionTitle}>二维码</Text>
                <Text style={styles.shareOptionDescription}>
                  生成二维码供他人扫描
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>分享提示</Text>
          <View style={styles.tipItem}>
            <Ionicons name="information-circle" size={16} color="#2196F3" />
            <Text style={styles.tipText}>
              分享码可以让其他人快速找到你的菜单
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="eye-off" size={16} color="#FF9800" />
            <Text style={styles.tipText}>
              只有公开的菜单才能被其他人查看
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.tipText}>
              只有标记为可用的菜品才会显示在分享内容中
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  menuPreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#f5f5f5',
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});

export default ShareRecipeScreen;
