# Scan from Image 技术方案

## 概述

从图片中扫描并提取食谱信息的功能，需要结合OCR（光学字符识别）和AI理解能力。

## 技术方案对比

### 方案 A: 后端AI方案（推荐）⭐

**技术栈：**
- 后端：OpenAI Vision API（GPT-4 Vision）
- 前端：expo-image-picker（已有）
- 流程：图片 → 后端 → OpenAI Vision API → 结构化数据

**优点：**
- ✅ 准确性高，AI能理解上下文
- ✅ 无需额外OCR库
- ✅ 可以识别手写和打印体
- ✅ 能理解食谱结构（标题、食材、步骤）
- ✅ 与你现有的AI优化系统集成
- ✅ 成本可控（约$0.01-0.03/图片）

**缺点：**
- ❌ 需要网络连接
- ❌ 需要OpenAI API key
- ❌ 处理时间稍长（2-5秒）

**成本：**
- OpenAI GPT-4 Vision: ~$0.01-0.03 per image

---

### 方案 B: 本地OCR + 后端AI解析

**技术栈：**
- 前端：react-native-text-recognition 或 expo-camera（OCR）
- 后端：OpenAI GPT（文本理解）
- 流程：图片 → 本地OCR提取文本 → 后端AI解析 → 结构化数据

**优点：**
- ✅ 支持离线OCR（部分功能）
- ✅ 文本提取和解析分离
- ✅ 可以缓存OCR结果

**缺点：**
- ❌ 需要安装额外的OCR库
- ❌ 本地OCR准确率较低
- ❌ 手写识别能力差
- ❌ 需要处理多语言支持

**成本：**
- 本地OCR：免费
- OpenAI GPT文本解析：~$0.001-0.005

---

### 方案 C: 云端OCR服务

**技术栈：**
- Google Cloud Vision API
- AWS Textract
- Azure Computer Vision

**优点：**
- ✅ 准确率高
- ✅ 支持多语言
- ✅ 手写识别能力强

**缺点：**
- ❌ 需要额外API key
- ❌ 成本较高
- ❌ 需要文本理解二次处理

**成本：**
- Google Vision: ~$1.50 per 1000 images
- AWS Textract: ~$1.50 per 1000 pages

---

### 方案 D: 混合方案（最佳体验）

**技术栈：**
1. 首先尝试本地OCR（快速预览）
2. 用户确认后发送到后端AI优化
3. 后端使用OpenAI Vision API做精确提取

**优点：**
- ✅ 快速预览（本地）
- ✅ 精确提取（云端）
- ✅ 最佳用户体验

**缺点：**
- ❌ 实现复杂度较高
- ❌ 需要两套系统

---

## 推荐方案：方案 A（后端AI方案）

基于你现有的架构，**推荐使用方案A**，原因：

1. **已有基础设施**
   - 已有后端服务器（`MenuApp/server/`）
   - 已集成OpenAI API
   - 已有AI优化流程

2. **最佳准确率**
   - GPT-4 Vision能理解食谱结构
   - 能识别手写和打印体
   - 能处理复杂的布局

3. **易于集成**
   - 只需添加一个API endpoint
   - 复用现有的AI优化逻辑
   - 前端只需调用API

4. **成本合理**
   - 每条食谱约$0.01-0.03
   - 比专业OCR服务便宜

---

## 实现步骤（方案A）

### 1. 后端实现

#### 1.1 添加新的API endpoint

在 `MenuApp/server/server.js` 中添加：

```javascript
/**
 * API Endpoint: Scan Recipe from Image
 */
app.post('/api/scan-recipe', async (req, res) => {
  const { imageBase64, imageUrl } = req.body;

  if (!imageBase64 && !imageUrl) {
    return res.status(400).json({
      error: 'Image data (base64 or URL) is required',
      success: false
    });
  }

  if (!openai) {
    return res.status(400).json({
      error: 'OpenAI API is not configured. Please set OPENAI_API_KEY in .env file.',
      success: false
    });
  }

  try {
    console.log('📷 Scanning recipe from image...');
    
    // Use OpenAI Vision API
    const imageContent = imageUrl 
      ? { type: "image_url", image_url: { url: imageUrl } }
      : { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4-vision-preview"
      messages: [
        {
          role: "system",
          content: "You are a recipe extraction expert. Extract recipe information from images and return it as JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract recipe information from this image. Return a JSON object with:
{
  "title": "Recipe title",
  "description": "Recipe description",
  "ingredients": [
    {"name": "ingredient name", "amount": "amount", "unit": "unit"},
    ...
  ],
  "instructions": [
    {"step": 1, "description": "step description"},
    ...
  ],
  "cookingTime": "cooking time",
  "servings": "servings",
  "tags": ["tag1", "tag2", ...]
}

Extract ALL visible information. If text is handwritten, do your best to read it.`
            },
            imageContent
          ]
        }
      ],
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const recipeData = JSON.parse(completion.choices[0].message.content);
    
    // Optimize the extracted recipe
    const recipe = await optimizeRecipeWithAI(recipeData, 'image');

    console.log(`✅ Recipe scanned: ${recipe.title}`);
    
    res.json({
      success: true,
      recipe
    });

  } catch (error) {
    console.error('Error scanning recipe:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to scan recipe from image',
      success: false
    });
  }
});
```

#### 1.2 安装依赖（如果需要）

```bash
cd MenuApp/server
npm install # openai已经安装
```

---

### 2. 前端实现

#### 2.1 创建ScanRecipeModal组件

创建 `MenuApp/src/components/ScanRecipeModal.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

interface ScanRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (recipe: any) => void;
}

const ScanRecipeModal: React.FC<ScanRecipeModalProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const scanRecipe = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(selectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get backend URL
      const { getBackendUrl, RECIPE_SCAN_ENDPOINT } = require('../config/recipeImport');
      const backendUrl = `${getBackendUrl()}${RECIPE_SCAN_ENDPOINT}`;

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to scan recipe');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to scan recipe');
      }

      Alert.alert('Success', 'Recipe scanned successfully!');
      onScan(data.recipe);
      setSelectedImage(null);
      onClose();

    } catch (error: any) {
      Alert.alert('Scan Failed', error.message || 'Failed to scan recipe from image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan Recipe from Image</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.image} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={24} color="#d96709" />
                  <Text style={styles.actionButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera-outline" size={24} color="#d96709" />
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#d96709" />
              <Text style={styles.infoText}>
                Take a photo or select an image of a recipe. The AI will extract all recipe information including title, ingredients, and instructions.
              </Text>
            </View>
          </ScrollView>

          {selectedImage && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.scanButton]}
                onPress={scanRecipe}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="scan-outline" size={20} color="#fff" />
                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>Scan Recipe</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    // Content scrollable
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#d96709',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#d96709',
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeImageButton: {
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  changeImageText: {
    color: '#666',
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  scanButton: {
    backgroundColor: '#d96709',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanRecipeModal;
```

#### 2.2 更新配置

在 `MenuApp/src/config/recipeImport.ts` 中添加：

```typescript
export const RECIPE_SCAN_ENDPOINT = '/api/scan-recipe';
```

#### 2.3 在HomeScreen中集成

在 `MenuApp/src/screens/HomeScreen.tsx` 中：

```typescript
import ScanRecipeModal from '../components/ScanRecipeModal';

// 添加state
const [showScanModal, setShowScanModal] = useState(false);

// 修改handleScanFromImage
const handleScanFromImage = () => {
  setShowRecipeOptions(false);
  setShowScanModal(true);
};

// 添加handleScanRecipe
const handleScanRecipe = (scannedRecipe: any) => {
  // Navigate to CreateRecipe screen with scanned data
  navigation.navigate('CreateRecipe', { 
    importedRecipe: scannedRecipe 
  });
};

// 在JSX中添加
<ScanRecipeModal
  visible={showScanModal}
  onClose={() => setShowScanModal(false)}
  onScan={handleScanRecipe}
/>
```

---

## 测试

### 测试步骤

1. **启动后端服务器**
   ```bash
   cd MenuApp/server
   npm start
   ```

2. **测试API**
   ```bash
   # 使用base64图片
   curl -X POST http://localhost:3001/api/scan-recipe \
     -H "Content-Type: application/json" \
     -d '{"imageBase64": "your_base64_string"}'
   ```

3. **在应用中测试**
   - 打开应用
   - 点击"Create Recipe"
   - 选择"Scan from Image"
   - 拍照或选择图片
   - 等待扫描完成

---

## 成本估算

- **单次扫描**: ~$0.01-0.03
- **100次扫描**: ~$1-3
- **1000次扫描**: ~$10-30

**建议：**
- 设置使用限制
- 考虑缓存结果
- 提供"预览"功能（缩略图）

---

## 优化建议

### 1. 图片预处理
- 自动裁剪和旋转
- 增强对比度
- 去除背景

### 2. 批量处理
- 支持多张图片
- 合并多页食谱

### 3. 离线支持
- 缓存已扫描的图片
- 离线查看历史

### 4. 用户体验
- 显示扫描进度
- 允许手动编辑结果
- 保存扫描历史

---

## 其他可选方案

### 本地OCR库（React Native）

如果需要离线支持，可以考虑：

1. **react-native-text-recognition**
   ```bash
   npm install react-native-text-recognition
   ```

2. **expo-camera + OCR**
   ```bash
   npx expo install expo-camera
   ```

3. **ML Kit (Firebase)**
   - 需要Firebase配置
   - 支持离线模式

---

## 总结

**推荐使用方案A（后端AI方案）**，因为：
- ✅ 与你现有架构完美集成
- ✅ 准确率最高
- ✅ 实现最简单
- ✅ 成本合理

如果需要离线支持，可以后续添加本地OCR作为备选方案。

