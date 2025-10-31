import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRecipe } from '../contexts/RecipeContext';
import { usePoints } from '../contexts/PointsContext';
import { Recipe, MenuItem } from '../types';

interface CreateRecipeScreenProps {
  navigation: any;
  route: any;
}

const CreateRecipeScreen: React.FC<CreateRecipeScreenProps> = ({
  navigation,
  route,
}) => {
  const { addRecipe, updateRecipe, getRecipeById } = useRecipe();
  const { addPoints } = usePoints();
  const isEditing = route?.params?.recipeId;
  const recipeName = route?.params?.recipeName;
  const existingRecipe = isEditing ? getRecipeById(route.params.recipeId) : null;

  const [recipeData, setRecipeData] = useState({
    title: existingRecipe?.title || recipeName || '',
    description: existingRecipe?.description || '',
    isPublic: existingRecipe?.isPublic || false,
    imageUri: existingRecipe?.imageUri || null,
    tags: existingRecipe?.tags || [],
    cookingTime: existingRecipe?.cookingTime || '',
    servings: existingRecipe?.servings || '',
    ingredients: existingRecipe?.ingredients || [],
    instructions: existingRecipe?.instructions || [],
    cookware: existingRecipe?.cookware || '',
  });

  // 使用ref存储最新的recipeData，避免闭包问题
  const recipeDataRef = useRef(recipeData);
  recipeDataRef.current = recipeData;

  const [items, setItems] = useState<MenuItem[]>(
    existingRecipe?.items || []
  );

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
  });

  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showCookingTimeDropdown, setShowCookingTimeDropdown] = useState(false);
  const [showServingsDropdown, setShowServingsDropdown] = useState(false);
  const [showCookwareDropdown, setShowCookwareDropdown] = useState(false);
  const [ingredients, setIngredients] = useState<any[]>(existingRecipe?.ingredients || []);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    amount: '',
    unit: '',
  });
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [instructions, setInstructions] = useState<any[]>(existingRecipe?.instructions || []);
  const [newInstruction, setNewInstruction] = useState({
    step: '',
    description: '',
    imageUri: null,
  });
  const [editingInstruction, setEditingInstruction] = useState<any>(null);
  const [editInstructionData, setEditInstructionData] = useState({
    description: '',
    imageUri: null,
  });
  const [isReordering, setIsReordering] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const tagInputRef = useRef<TextInput>(null);

  const categories = ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Other'];
  
  const commonTags = [
    'Quick & Easy', 'Healthy', 'Vegetarian', 'Vegan', 'Gluten-Free',
    'Low-Carb', 'High-Protein', 'Comfort Food', 'Spicy', 'Sweet',
    'Savory', 'Crispy', 'Creamy', 'Fresh', 'Homemade',
    'Traditional', 'Modern', 'Fusion', 'Mediterranean', 'Asian',
    'Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese'
  ];

  const cookingTimeOptions = [
    'Under 15 minutes', '15-30 minutes', '30-45 minutes', '45-60 minutes',
    '1-2 hours', '2-4 hours', '4+ hours', 'Overnight'
  ];

  const servingsOptions = [
    '1 serving', '2 servings', '3-4 servings', '4-6 servings',
    '6-8 servings', '8-10 servings', '10+ servings'
  ];

  const unitOptions = [
    'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
    'pound', 'pounds', 'ounce', 'ounces', 'gram', 'grams', 'kilogram', 'kilograms',
    'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons',
    'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
    'can', 'cans', 'bottle', 'bottles', 'package', 'packages',
    'pinch', 'dash', 'to taste', 'as needed'
  ];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log('Image picked:', asset.uri);
      console.log('Base64 length:', asset.base64 ? asset.base64.length : 'No base64');
      
      // 直接使用文件URI，不使用base64
      const imageUri = asset.uri;
      console.log('Using file URI:', imageUri);
      setRecipeData(prevData => {
        const newData = { ...prevData, imageUri: imageUri };
        console.log('Image uploaded successfully, recipeData.imageUri set to:', imageUri);
        console.log('Updated recipeData:', newData);
        return newData;
      });
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log('Photo taken:', asset.uri);
      console.log('Base64 length:', asset.base64 ? asset.base64.length : 'No base64');
      
      // 直接使用文件URI，不使用base64
      const imageUri = asset.uri;
      console.log('Using file URI:', imageUri);
      setRecipeData(prevData => {
        const newData = { ...prevData, imageUri: imageUri };
        console.log('Photo taken successfully, recipeData.imageUri set to:', imageUri);
        console.log('Updated recipeData:', newData);
        return newData;
      });
    }
  };

  const removeImage = () => {
    setRecipeData({ ...recipeData, imageUri: null });
  };

  const addTagsFromString = (input: string) => {
    if (!input) return;
    // 支持逗号/空格分隔，一次添加多个；去重、去空
    const pieces = input
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(Boolean);
    if (pieces.length === 0) return;
    const existing = new Set((recipeData.tags || []).map(t => t.toLowerCase()));
    const merged: string[] = [...(recipeData.tags || [])];
    for (const p of pieces) {
      const key = p.toLowerCase();
      if (!existing.has(key)) {
        existing.add(key);
        merged.push(p);
      }
    }
    setRecipeData({ ...recipeData, tags: merged });
  };

  const addTag = () => {
    addTagsFromString(newTag);
    setNewTag('');
  };

  const removeTag = (index: number) => {
    const updatedTags = recipeData.tags.filter((_, i) => i !== index);
    setRecipeData({ ...recipeData, tags: updatedTags });
  };

  const selectTag = (tag: string) => {
    if (!recipeData.tags.includes(tag)) {
      setRecipeData({
        ...recipeData,
        tags: [...recipeData.tags, tag]
      });
    }
    setShowTagSuggestions(false);
  };

  const selectCookingTime = (time: string) => {
    setRecipeData({ ...recipeData, cookingTime: time });
    setShowCookingTimeDropdown(false);
  };

  const selectServings = (servings: string) => {
    setRecipeData({ ...recipeData, servings: servings });
    setShowServingsDropdown(false);
  };

  const addIngredient = () => {
    if (newIngredient.name.trim() && newIngredient.amount.trim() && newIngredient.unit) {
      const ingredient = {
        id: Date.now().toString(),
        name: newIngredient.name.trim(),
        amount: parseFloat(newIngredient.amount),
        unit: newIngredient.unit,
      };
      const updatedIngredients = [...ingredients, ingredient];
      setIngredients(updatedIngredients);
      setRecipeData({ ...recipeData, ingredients: updatedIngredients });
      setNewIngredient({ name: '', amount: '', unit: '' });
    }
  };

  const removeIngredient = (index: number) => {
    const updatedIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(updatedIngredients);
    setRecipeData({ ...recipeData, ingredients: updatedIngredients });
  };

  const selectUnit = (unit: string) => {
    setNewIngredient({ ...newIngredient, unit });
    setShowUnitDropdown(false);
  };

  const addInstruction = () => {
    if (newInstruction.description.trim()) {
      const instruction = {
        id: Date.now().toString(),
        step: instructions.length + 1,
        description: newInstruction.description.trim(),
        imageUri: newInstruction.imageUri,
      };
      const updatedInstructions = [...instructions, instruction];
      setInstructions(updatedInstructions);
      setRecipeData({ ...recipeData, instructions: updatedInstructions });
      setNewInstruction({ step: '', description: '', imageUri: null });
    }
  };

  const removeInstruction = (index: number) => {
    const updatedInstructions = instructions.filter((_, i) => i !== index);
    // Update step numbers
    const renumberedInstructions = updatedInstructions.map((instruction, i) => ({
      ...instruction,
      step: i + 1,
    }));
    setInstructions(renumberedInstructions);
    setRecipeData({ ...recipeData, instructions: renumberedInstructions });
  };

  const startEditingInstruction = (instruction: any, index: number) => {
    setEditingInstruction({ ...instruction, index });
    setEditInstructionData({
      description: instruction.description,
      imageUri: instruction.imageUri,
    });
  };

  const cancelEditingInstruction = () => {
    setEditingInstruction(null);
    setEditInstructionData({ description: '', imageUri: null });
  };

  const saveEditingInstruction = () => {
    if (editingInstruction && editingInstruction.index !== undefined) {
      const updatedInstructions = [...instructions];
      updatedInstructions[editingInstruction.index] = {
        ...updatedInstructions[editingInstruction.index],
        description: editInstructionData.description,
        imageUri: editInstructionData.imageUri,
      };
      setInstructions(updatedInstructions);
      setRecipeData({ ...recipeData, instructions: updatedInstructions });
      setEditingInstruction(null);
      setEditInstructionData({ description: '', imageUri: null });
    }
  };

  const pickEditInstructionImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Data = asset.base64;
      const dataUri = `data:image/jpeg;base64,${base64Data}`;
      setEditInstructionData({ ...editInstructionData, imageUri: dataUri });
    }
  };

  const takeEditInstructionPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Data = asset.base64;
      const dataUri = `data:image/jpeg;base64,${base64Data}`;
      setEditInstructionData({ ...editInstructionData, imageUri: dataUri });
    }
  };

  const removeEditInstructionImage = () => {
    setEditInstructionData({ ...editInstructionData, imageUri: null });
  };

  const moveInstructionUp = (index: number) => {
    if (index > 0) {
      const updatedInstructions = [...instructions];
      const temp = updatedInstructions[index];
      updatedInstructions[index] = updatedInstructions[index - 1];
      updatedInstructions[index - 1] = temp;
      
      // Update step numbers
      const renumberedInstructions = updatedInstructions.map((instruction, i) => ({
        ...instruction,
        step: i + 1,
      }));
      
      setInstructions(renumberedInstructions);
      setRecipeData({ ...recipeData, instructions: renumberedInstructions });
    }
  };

  const moveInstructionDown = (index: number) => {
    if (index < instructions.length - 1) {
      const updatedInstructions = [...instructions];
      const temp = updatedInstructions[index];
      updatedInstructions[index] = updatedInstructions[index + 1];
      updatedInstructions[index + 1] = temp;
      
      // Update step numbers
      const renumberedInstructions = updatedInstructions.map((instruction, i) => ({
        ...instruction,
        step: i + 1,
      }));
      
      setInstructions(renumberedInstructions);
      setRecipeData({ ...recipeData, instructions: renumberedInstructions });
    }
  };

  const toggleReordering = () => {
    if (instructions.length < 2) {
      Alert.alert('Cannot Reorder', 'You need at least 2 steps to reorder them.');
      return;
    }
    setIsReordering(!isReordering);
    if (editingInstruction) {
      setEditingInstruction(null);
      setEditInstructionData({ description: '', imageUri: null });
    }
  };

  const pickInstructionImage = async () => {
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
    });

    if (!result.canceled) {
      setNewInstruction({ ...newInstruction, imageUri: result.assets[0].uri });
    }
  };

  const takeInstructionPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewInstruction({ ...newInstruction, imageUri: result.assets[0].uri });
    }
  };

  const removeInstructionImage = () => {
    setNewInstruction({ ...newInstruction, imageUri: null });
  };

  const scrollToInput = (inputRef: any, offset: number = 0) => {
    setTimeout(() => {
      inputRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        const scrollY = y - 100 + offset; // 100px above the input
        scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollY), animated: true });
      });
    }, 100);
  };

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Recipe' : 'Create New Recipe',
      headerRight: () => (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing]);

  const handleSave = () => {
    // TODO: Add validation later
    // const errors = [];
    // if (!recipeData.title.trim()) {
    //   errors.push('Recipe Title');
    // }
    // ... other validation logic

    Alert.alert(
      'Save Recipe',
      'How would you like to save this recipe?',
      [
        {
          text: 'Save as Draft',
          style: 'default',
          onPress: () => handleSaveAsDraft(),
        },
        {
          text: 'Publish Recipe',
          style: 'default',
          onPress: () => handlePublishRecipe(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSaveAsDraft = () => {
    // 草稿不做严格校验，直接以 isPublic=false 保存并同步
    saveRecipeDataWithVisibility(false);
    Alert.alert('Success', 'Recipe saved as draft', [
      { text: 'OK', onPress: () => navigation.navigate('RecipeList') },
    ]);
  };

  // 验证recipe数据的函数
  const validateRecipe = () => {
    // 使用ref中的最新值
    const currentRecipeData = recipeDataRef.current;
    
    // 调试信息
    console.log('Validation - Full recipeData object:', JSON.stringify(currentRecipeData, null, 2));
    console.log('Validation - recipeData.imageUri:', currentRecipeData.imageUri);
    console.log('Validation - recipeData.imageUri type:', typeof currentRecipeData.imageUri);
    console.log('Validation - recipeData.imageUri truthy:', !!currentRecipeData.imageUri);
    
    // 1. 验证标题
    if (!currentRecipeData.title || currentRecipeData.title.trim() === '') {
      Alert.alert('Validation Error', 'Recipe title is required. Please enter a title for your recipe.');
      return false;
    }

    // 2. 验证主页照片
    if (!currentRecipeData.imageUri) {
      console.log('Validation failed - imageUri is falsy:', currentRecipeData.imageUri);
      Alert.alert('Validation Error', 'Recipe photo is required. Please add a main photo for your recipe.');
      return false;
    }

    // 3. 验证烹饪时间
    if (!currentRecipeData.cookingTime || currentRecipeData.cookingTime.trim() === '') {
      Alert.alert('Validation Error', 'Cooking time is required. Please select a cooking time for your recipe.');
      return false;
    }

    // 4. 验证份量
    if (!currentRecipeData.servings || currentRecipeData.servings.trim() === '') {
      Alert.alert('Validation Error', 'Servings is required. Please select the number of servings for your recipe.');
      return false;
    }

    // 5. 验证至少一个配料
    if (!currentRecipeData.ingredients || currentRecipeData.ingredients.length === 0) {
      Alert.alert('Validation Error', 'At least one ingredient is required. Please add ingredients for your recipe.');
      return false;
    }

    // 6. 验证至少一个步骤
    if (!currentRecipeData.instructions || currentRecipeData.instructions.length === 0) {
      Alert.alert('Validation Error', 'At least one instruction step is required. Please add cooking instructions for your recipe.');
      return false;
    }

    return true;
  };

  const handlePublishRecipe = () => {
    // 使用setTimeout确保状态已更新
    setTimeout(() => {
      // 验证recipe数据
      if (!validateRecipe()) {
        return; // 验证失败，不继续执行
      }
      
      // 验证通过，继续保存流程
      saveRecipeDataWithVisibility(true);
    }, 200); // 增加延迟时间确保状态更新
  };

  const saveRecipeDataWithVisibility = (isPublic: boolean) => {
    // 使用ref中的最新值
    const currentRecipeData = recipeDataRef.current;

    const recipeDataToSave = {
      ...currentRecipeData,
      isPublic, // 由调用方决定是否公开（发布=true；草稿=false）
      items,
      // 使用currentRecipeData中的ingredients和instructions，确保数据一致性
      ingredients: currentRecipeData.ingredients,
      instructions: currentRecipeData.instructions,
    };

    // 调试信息
    console.log('Saving recipe with data:', {
      title: recipeDataToSave.title,
      description: recipeDataToSave.description,
      ingredients: recipeDataToSave.ingredients.length,
      instructions: recipeDataToSave.instructions.length,
      cookingTime: recipeDataToSave.cookingTime,
      servings: recipeDataToSave.servings,
      tags: recipeDataToSave.tags.length,
      imageUri: recipeDataToSave.imageUri ? 'Has image' : 'No image',
      isPublic: recipeDataToSave.isPublic
    });
    
    // 详细调试信息
    console.log('Full recipeDataToSave object:', JSON.stringify(recipeDataToSave, null, 2));
    console.log('Ingredients details:', recipeDataToSave.ingredients);
    console.log('Instructions details:', recipeDataToSave.instructions);

    let savedRecipe;
    if (isEditing && existingRecipe) {
      const updatedRecipe = {
        ...existingRecipe,
        ...recipeDataToSave,
      };
      updateRecipe(updatedRecipe);
      savedRecipe = updatedRecipe;
    } else {
      // 调用addRecipe方法，它会返回创建的recipe对象
      savedRecipe = addRecipe(recipeDataToSave);
      
      // 添加创建菜谱积分
      addPoints('create_recipe', `Created recipe: ${savedRecipe.title}`, savedRecipe.id);
    }

    // 保存后的调试信息
    console.log('Recipe saved successfully:', {
      id: savedRecipe.id,
      title: savedRecipe.title,
      ingredients: savedRecipe.ingredients.length,
      instructions: savedRecipe.instructions.length,
      imageUri: savedRecipe.imageUri ? 'Has image' : 'No image'
    });

    // 直接跳转到菜谱预览页面，并设置返回目标为My Recipe
    navigation.navigate('RecipeDetail', { 
      recipeId: savedRecipe.id,
      returnTo: 'RecipeList'
    });
  };

  const addMenuItem = () => {
    if (!newItem.name.trim()) {
      Alert.alert('Error', 'Please enter dish name');
      return;
    }

    if (!newItem.price || isNaN(Number(newItem.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description,
      price: Number(newItem.price),
      category: newItem.category,
      isAvailable: true,
    };

    setItems([...items, item]);
    setNewItem({ name: '', description: '', price: '', category: 'Main Course' });
  };

  const removeMenuItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const toggleItemAvailability = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  const renderMenuItem = (item: MenuItem) => (
    <View key={item.id} style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <Text style={styles.menuItemCategory}>{item.category}</Text>
        </View>
        <View style={styles.menuItemActions}>
          <Text style={styles.menuItemPrice}>¥{item.price}</Text>
          <TouchableOpacity
            style={styles.availabilityButton}
            onPress={() => toggleItemAvailability(item.id)}
          >
            <Ionicons
              name={item.isAvailable ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={item.isAvailable ? '#d96709' : '#F44336'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeMenuItem(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 50}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Recipe Photo Section */}
        <View style={styles.recipePhotoSection}>
          <Text style={styles.sectionTitle}>
            Add Recipe Photo <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>Upload a photo of your delicious dish</Text>
          <View style={styles.recipeImageUploadBox}>
            <View style={styles.recipeImageHeader}>
              <Ionicons name="camera-outline" size={16} color="#666" />
              <Text style={styles.recipeImageLabel}>Recipe Photo</Text>
            </View>
            {recipeData.imageUri ? (
              <View style={styles.recipeImagePreview}>
                <Image source={{ uri: recipeData.imageUri }} style={styles.recipeImage} />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                  <Ionicons name="close-circle" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recipeImageUploadContent}>
                <View style={styles.recipeImageButtonRow}>
                  <TouchableOpacity style={styles.recipeChooseImageButton} onPress={pickImage}>
                    <Ionicons name="image-outline" size={18} color="white" />
                    <Text style={styles.recipeChooseImageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recipeCameraButton} onPress={takePhoto}>
                    <Ionicons name="camera-outline" size={18} color="white" />
                    <Text style={styles.recipeCameraButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.recipeImageFormatText}>Supported formats: JPG, PNG, WebP (Max 50MB)</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.recipeInfoSection}>
          <Text style={styles.sectionTitle}>Recipe Information</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.requiredLabel}>
                    Recipe Title <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
            <TextInput
              ref={titleInputRef}
              style={styles.input}
              value={recipeData.title}
              onChangeText={text => setRecipeData({ ...recipeData, title: text })}
              placeholder="Enter recipe title"
              onFocus={() => scrollToInput(titleInputRef, 200)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipe Description</Text>
            <TextInput
              ref={descriptionInputRef}
              style={[styles.input, styles.textArea]}
              value={recipeData.description}
              onChangeText={text => setRecipeData({ ...recipeData, description: text })}
              placeholder="Every dish tells a story. What's yours? Capture its taste, texture, and the moment behind it..."
              multiline
              numberOfLines={3}
              onFocus={() => scrollToInput(descriptionInputRef, 200)}
            />
          </View>
          <View style={styles.switchGroup}>
            <Text style={styles.label}>Public Recipe</Text>
            <Switch
              value={recipeData.isPublic}
              onValueChange={value => setRecipeData({ ...recipeData, isPublic: value })}
            />
          </View>
        </View>

        <View style={styles.recipeTagsSection}>
          <Text style={styles.sectionTitle}>Recipe Tags</Text>
          <Text style={styles.sectionSubtitle}>Add tags to help others discover your recipe</Text>
          <View style={styles.tagsContainer}>
            <TextInput
              ref={tagInputRef}
              style={styles.tagInput}
              placeholder="Enter a tag and press Enter"
              value={newTag}
              onChangeText={(text) => {
                // 如果用户输入了分隔符（逗号/空格/回车前捕获），自动提交当前片段
                if (/[\s,]$/.test(text)) {
                  addTagsFromString(text);
                  setNewTag('');
                } else {
                  setNewTag(text);
                }
              }}
              onSubmitEditing={addTag}
              onFocus={() => {
                setShowTagSuggestions(true);
                scrollToInput(tagInputRef, 200);
              }}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 300)}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
            {showTagSuggestions && (
              <View style={styles.tagSuggestions}>
                <Text style={styles.suggestionsTitle}>Popular Tags:</Text>
                <ScrollView showsVerticalScrollIndicator={true} style={styles.tagSuggestionsScroll}>
                  <View style={styles.suggestionsList}>
                    {commonTags
                      .filter(tag => !recipeData.tags.includes(tag))
                      .slice(0, 12)
                      .map((tag, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionTag}
                          onPress={() => selectTag(tag)}
                        >
                          <Text style={styles.suggestionTagText}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </ScrollView>
              </View>
            )}
          {recipeData.tags && recipeData.tags.length > 0 && (
            <View style={styles.tagsList}>
              {recipeData.tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(index)}>
                    <Ionicons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.cookingDetailsSection}>
          <Text style={styles.sectionTitle}>Cooking Details</Text>
          
          {/* Cookware Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Main Cookware</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCookwareDropdown(!showCookwareDropdown)}
            >
              <Text style={[styles.dropdownText, !recipeData.cookware && styles.placeholderText]}>
                {recipeData.cookware || 'Select main cookware'}
              </Text>
              <Ionicons
                name={showCookwareDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {showCookwareDropdown && (
              <View style={[styles.dropdownList, { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 999999, elevation: 100, maxHeight: 200 }]}>
                <ScrollView showsVerticalScrollIndicator={true}>
                  {[
                    'Regular Pan/Pot',
                    'Air Fryer',
                    'Oven',
                    'Pizza Oven',
                    'Grill',
                    'Microwave',
                    'Slow Cooker',
                    'Pressure Cooker',
                    'Wok',
                    'Other'
                  ].map((cookware) => (
                    <TouchableOpacity
                      key={cookware}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setRecipeData(prev => ({ ...prev, cookware }));
                        setShowCookwareDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{cookware}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.requiredLabel}>
                Cooking Time <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCookingTimeDropdown(!showCookingTimeDropdown)}
              >
                <Text style={[styles.dropdownText, !recipeData.cookingTime && styles.placeholderText]}>
                  {recipeData.cookingTime || 'Select cooking time'}
                </Text>
                <Ionicons
                  name={showCookingTimeDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
              {showCookingTimeDropdown && (
                <View style={[styles.dropdownList, { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 999999, elevation: 100, maxHeight: 200 }]}>
                  <ScrollView showsVerticalScrollIndicator={true}>
                    {cookingTimeOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => selectCookingTime(option)}
                      >
                        <Text style={styles.dropdownItemText}>{option}</Text>
                        {recipeData.cookingTime === option && (
                          <Ionicons name="checkmark" size={20} color="#d96709" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.requiredLabel}>
                Servings <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowServingsDropdown(!showServingsDropdown)}
              >
                <Text style={[styles.dropdownText, !recipeData.servings && styles.placeholderText]}>
                  {recipeData.servings || 'Select servings'}
                </Text>
                <Ionicons
                  name={showServingsDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
              {showServingsDropdown && (
                <View style={[styles.dropdownList, { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 999999, elevation: 100, maxHeight: 200 }]}>
                  <ScrollView showsVerticalScrollIndicator={true}>
                    {servingsOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => selectServings(option)}
                      >
                        <Text style={styles.dropdownItemText}>{option}</Text>
                        {recipeData.servings === option && (
                          <Ionicons name="checkmark" size={20} color="#d96709" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>
            Ingredients <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>Add at least one ingredient for your recipe</Text>
          
          <View style={styles.ingredientForm}>
            <View style={styles.ingredientRow}>
              <View style={[styles.ingredientField, { flex: 2 }]}>
                <Text style={styles.ingredientLabel}>Name</Text>
                <TextInput
                  style={styles.ingredientInput}
                  placeholder="e.g., flour, salt, butter"
                  value={newIngredient.name}
                  onChangeText={text => setNewIngredient({ ...newIngredient, name: text })}
                />
              </View>
              <View style={[styles.ingredientField, { flex: 1, marginHorizontal: 4 }]}>
                <Text style={styles.ingredientLabel}>Amount</Text>
                <TextInput
                  style={styles.ingredientInput}
                  placeholder="2"
                  value={newIngredient.amount}
                  onChangeText={text => setNewIngredient({ ...newIngredient, amount: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.ingredientField, { flex: 1.5 }]}>
                <Text style={styles.ingredientLabel}>Unit</Text>
                <TouchableOpacity
                  style={styles.unitDropdownButton}
                  onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                >
                  <Text style={[styles.unitDropdownText, !newIngredient.unit && styles.placeholderText]}>
                    {newIngredient.unit || 'Select'}
                  </Text>
                  <Ionicons
                    name={showUnitDropdown ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#666"
                  />
                </TouchableOpacity>
                  {showUnitDropdown && (
                    <View style={[styles.unitDropdownList, { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 999999, elevation: 100, maxHeight: 200 }]}>
                      <ScrollView showsVerticalScrollIndicator={true}>
                        {unitOptions.map((unit, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.unitDropdownItem}
                            onPress={() => selectUnit(unit)}
                          >
                            <Text style={styles.unitDropdownItemText}>{unit}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.addIngredientButton,
                (!newIngredient.name.trim() || !newIngredient.amount.trim() || !newIngredient.unit) && styles.addIngredientButtonDisabled
              ]} 
              onPress={addIngredient}
              disabled={!newIngredient.name.trim() || !newIngredient.amount.trim() || !newIngredient.unit}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addIngredientButtonText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>

          {ingredients.length > 0 && (
            <View style={styles.ingredientsList}>
              {ingredients.map((ingredient, index) => (
                <View key={ingredient.id} style={styles.ingredientItem}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientAmount}>{ingredient.amount} {ingredient.unit}</Text>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeIngredient(index)}>
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>
            Instructions <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>Add at least one step for your recipe</Text>
          
          <View style={styles.instructionForm}>
            <View style={styles.instructionStepContainer}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>{instructions.length + 1}</Text>
              </View>
              <View style={styles.instructionInputContainer}>
                <TextInput
                  style={[styles.instructionInput, styles.instructionTextArea]}
                  placeholder="Start from the prep and walk us through each step – make it simple enough for beginners to cook with you."
                  value={newInstruction.description}
                  onChangeText={text => setNewInstruction({ ...newInstruction, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.instructionImageSection}>
              <View style={styles.instructionImageUploadBox}>
                <View style={styles.instructionImageHeader}>
                  <Ionicons name="camera-outline" size={16} color="#666" />
                  <Text style={styles.instructionImageLabel}>Step Image (Optional)</Text>
                </View>
                {newInstruction.imageUri ? (
                  <View style={styles.instructionImagePreview}>
                    <Image source={{ uri: newInstruction.imageUri }} style={styles.instructionImage} />
                    <TouchableOpacity style={styles.removeInstructionImageButton} onPress={removeInstructionImage}>
                      <Ionicons name="close-circle" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ) : (
                        <View style={styles.instructionImageUploadContent}>
                          <View style={styles.imageButtonRow}>
                            <TouchableOpacity style={styles.chooseImageButton} onPress={pickInstructionImage}>
                              <Ionicons name="image-outline" size={18} color="white" />
                              <Text style={styles.chooseImageButtonText}>Gallery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cameraButton} onPress={takeInstructionPhoto}>
                              <Ionicons name="camera-outline" size={18} color="white" />
                              <Text style={styles.cameraButtonText}>Camera</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.imageFormatText}>Supported formats: JPG, PNG, WebP (Max 50MB)</Text>
                        </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.addInstructionButton,
                !newInstruction.description.trim() && styles.addInstructionButtonDisabled
              ]} 
              onPress={addInstruction}
              disabled={!newInstruction.description.trim()}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addInstructionButtonText}>Add Step</Text>
            </TouchableOpacity>
          </View>

          {instructions.length > 0 && (
            <View style={styles.instructionsList}>
              <View style={styles.reorderSection}>
                <TouchableOpacity 
                  style={[styles.reorderButton, isReordering && styles.reorderButtonActive]} 
                  onPress={toggleReordering}
                >
                  <Ionicons 
                    name={isReordering ? "checkmark" : "reorder-three-outline"} 
                    size={20} 
                    color={isReordering ? "white" : "#666"} 
                  />
                  <Text style={[styles.reorderButtonText, isReordering && styles.reorderButtonTextActive]}>
                    {isReordering ? "Done Reordering" : "Reorder Steps"}
                  </Text>
                </TouchableOpacity>
              </View>
              {instructions.map((instruction, index) => (
                <View key={instruction.id} style={styles.instructionItem}>
                  {editingInstruction && editingInstruction.index === index ? (
                    // Editing mode
                    <View style={styles.instructionEditMode}>
                      <View style={styles.instructionEditHeader}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{instruction.step}</Text>
                        </View>
                        <View style={styles.instructionEditActions}>
                          <TouchableOpacity 
                            style={styles.saveEditButton} 
                            onPress={saveEditingInstruction}
                          >
                            <Ionicons name="checkmark" size={16} color="white" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.cancelEditButton} 
                            onPress={cancelEditingInstruction}
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <TextInput
                        style={[styles.instructionInput, styles.instructionTextArea, styles.editInstructionTextArea]}
                        placeholder="Edit step description..."
                        value={editInstructionData.description}
                        onChangeText={text => setEditInstructionData({ ...editInstructionData, description: text })}
                        multiline
                        numberOfLines={6}
                      />

                      <View style={[styles.instructionImageSection, { marginTop: 16 }]}>
                        <View style={[styles.instructionImageUploadBox, { padding: 24 }]}>
                          <View style={styles.instructionImageHeader}>
                            <Ionicons name="camera-outline" size={18} color="#666" />
                            <Text style={[styles.instructionImageLabel, { fontSize: 16, fontWeight: '600' }]}>Step Image (Optional)</Text>
                          </View>
                          {editInstructionData.imageUri ? (
                            <View style={styles.instructionImagePreview}>
                              <Image source={{ uri: editInstructionData.imageUri }} style={styles.instructionImage} />
                              <TouchableOpacity style={styles.removeInstructionImageButton} onPress={removeEditInstructionImage}>
                                <Ionicons name="close-circle" size={20} color="#F44336" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.instructionImageUploadContent}>
                              <View style={[styles.imageButtonRow, { marginBottom: 16, justifyContent: 'center' }]}>
                                <TouchableOpacity style={[styles.chooseImageButton, { paddingVertical: 16, paddingHorizontal: 24, marginRight: 16 }]} onPress={pickEditInstructionImage}>
                                  <Ionicons name="image-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.cameraButton, { paddingVertical: 16, paddingHorizontal: 24 }]} onPress={takeEditInstructionPhoto}>
                                  <Ionicons name="camera-outline" size={24} color="white" />
                                </TouchableOpacity>
                              </View>
                              <Text style={[styles.imageFormatText, { fontSize: 14 }]}>Supported formats: JPG, PNG, WebP (Max 50MB)</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ) : (
                    // Display mode
                    <View>
                      <View style={styles.instructionHeader}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{instruction.step}</Text>
                        </View>
                        <View style={styles.instructionActions}>
                          {isReordering ? (
                            <View style={styles.reorderActions}>
                              <TouchableOpacity 
                                style={[styles.reorderMoveButton, index === 0 && styles.reorderMoveButtonDisabled]} 
                                onPress={() => moveInstructionUp(index)}
                                disabled={index === 0}
                              >
                                <Ionicons name="chevron-up" size={16} color={index === 0 ? "#ccc" : "#666"} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.reorderMoveButton, index === instructions.length - 1 && styles.reorderMoveButtonDisabled]} 
                                onPress={() => moveInstructionDown(index)}
                                disabled={index === instructions.length - 1}
                              >
                                <Ionicons name="chevron-down" size={16} color={index === instructions.length - 1 ? "#ccc" : "#666"} />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <>
                              <TouchableOpacity 
                                style={styles.editInstructionButton} 
                                onPress={() => startEditingInstruction(instruction, index)}
                              >
                                <Ionicons name="create-outline" size={16} color="#FF6B35" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => removeInstruction(index)}>
                                <Ionicons name="trash-outline" size={20} color="#F44336" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                      <Text style={styles.instructionDescription}>{instruction.description}</Text>
                      {instruction.imageUri && (
                        <Image source={{ uri: instruction.imageUri }} style={styles.instructionStepImage} />
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dish List ({items.length})</Text>
            {items.map(renderMenuItem)}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  section: {
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
  // Section zIndex values (higher = more on top)
  recipePhotoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  recipeInfoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2000,
  },
  recipeTagsSection: {
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
  cookingDetailsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 4000,
  },
  ingredientsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5000,
  },
  instructionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 6000,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recipeImageUploadBox: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  recipeImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeImageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  recipeImageUploadContent: {
    alignItems: 'center',
  },
  recipeImagePreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  recipeImageButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  recipeChooseImageButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  recipeChooseImageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  recipeCameraButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  recipeCameraButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  recipeImageFormatText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  requiredLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  menuItemCategory: {
    fontSize: 12,
    color: '#999',
  },
  menuItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginRight: 8,
  },
  availabilityButton: {
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#1976d2',
    marginRight: 6,
  },
  tagSuggestions: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 100,
    zIndex: 7000,
    position: 'relative',
  },
  tagSuggestionsScroll: {
    maxHeight: 150,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionTag: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  suggestionTagText: {
    fontSize: 12,
    color: '#666',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    zIndex: 99998,
    elevation: 49,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  ingredientForm: {
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ingredientField: {
    marginBottom: 8,
  },
  ingredientLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  ingredientInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: 'white',
  },
  unitDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    zIndex: 99998,
    elevation: 49,
  },
  unitDropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  unitDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 50,
  },
  unitDropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unitDropdownItemText: {
    fontSize: 12,
    color: '#333',
  },
  addIngredientButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addIngredientButtonDisabled: {
    backgroundColor: '#FFB299',
  },
  addIngredientButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  ingredientsList: {
    marginTop: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  ingredientName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  instructionForm: {
    marginBottom: 16,
  },
  instructionStepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumberCircle: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionInputContainer: {
    flex: 1,
  },
  instructionInput: {
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  instructionTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  instructionImageSection: {
    marginBottom: 16,
  },
  instructionImageUploadBox: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  instructionImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionImageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  instructionImageUploadContent: {
    alignItems: 'center',
  },
  imageButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  chooseImageButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  chooseImageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cameraButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  imageFormatText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  instructionImagePreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  instructionImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  removeInstructionImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  addInstructionButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addInstructionButtonDisabled: {
    backgroundColor: '#FFB299',
  },
  addInstructionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  instructionsList: {
    marginTop: 8,
  },
  instructionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepNumber: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  instructionStepImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  instructionEditMode: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#FF6B35',
    marginBottom: 16,
  },
  instructionEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  instructionEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveEditButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cancelEditButton: {
    backgroundColor: '#F44336',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInstructionButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  editInstructionTextArea: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    marginBottom: 20,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 100,
  },
  reorderButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  reorderButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  reorderButtonTextActive: {
    color: 'white',
  },
  reorderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderMoveButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reorderMoveButtonDisabled: {
    backgroundColor: '#f8f8f8',
    borderColor: '#e0e0e0',
  },
  reorderSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
});

export default CreateRecipeScreen;
