import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRecipe } from '../contexts/RecipeContext';
import { usePoints } from '../contexts/PointsContext';
import { useAuth } from '../contexts/AuthContext';
import { useBadges } from '../contexts/BadgeContext';
import { RealTimeSyncService } from '../services/realTimeSyncService';
import { Recipe, MenuItem } from '../types';
import ImportRecipeModal from '../components/ImportRecipeModal';

interface CreateRecipeScreenProps {
  navigation: any;
  route: any;
}

const CreateRecipeScreen: React.FC<CreateRecipeScreenProps> = ({
  navigation,
  route,
}) => {
  const { addRecipe, updateRecipe, getRecipeById, state } = useRecipe();
  const { addPoints } = usePoints();
  const { user } = useAuth();
  const { checkBadgeUnlock, getBadgeById } = useBadges();
  const isEditing = route?.params?.recipeId;
  const recipeName = route?.params?.recipeName;
  const showImportOnMount = route?.params?.showImport || false;
  const importedRecipe = route?.params?.importedRecipe;
  const scannedImageUri = route?.params?.scannedImageUri; // Image URI from scan
  const fromChallenge = route?.params?.fromChallenge || false; // Check if coming from challenge
  const existingRecipe = isEditing ? getRecipeById(route.params.recipeId) : null;

  // Set default cookware to "Chef iQ Mini Oven" if from challenge
  const defaultCookware = fromChallenge ? 'Chef iQ Mini Oven' : (existingRecipe?.cookware || '');

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
    cookware: defaultCookware,
    youtubeVideos: existingRecipe?.youtubeVideos || undefined,
    youtubeSearchUrl: existingRecipe?.youtubeSearchUrl || undefined,
  } as any);

  // Use ref to store latest recipeData to avoid closure issues
  const recipeDataRef = useRef(recipeData);
  recipeDataRef.current = recipeData;

  // Ensure cookware is always "Chef iQ Mini Oven" if from challenge
  // Also ensure "Chef iQ Challenge" tag is present
  useEffect(() => {
    if (fromChallenge) {
      setRecipeData((prev: any) => {
        const updatedData: any = {};
        let needsUpdate = false;

        // Force cookware to "Chef iQ Mini Oven"
        if (prev.cookware !== 'Chef iQ Mini Oven') {
          updatedData.cookware = 'Chef iQ Mini Oven';
          needsUpdate = true;
        }

        // Add "Chef iQ Challenge" tag if not present
        const currentTags = prev.tags || [];
        const challengeTag = 'Chef iQ Challenge';
        if (!currentTags.includes(challengeTag)) {
          updatedData.tags = [...currentTags, challengeTag];
          needsUpdate = true;
        }

        return needsUpdate ? { ...prev, ...updatedData } : prev;
      });
    }
  }, [fromChallenge]);

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
  const [showCookwareDropdown, setShowCookwareDropdown] = useState(false);
  const [ingredients, setIngredients] = useState<any[]>(existingRecipe?.ingredients || []);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    amount: '',
    unit: '',
  });
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [instructions, setInstructions] = useState<any[]>(existingRecipe?.instructions || []);
  const [newInstruction, setNewInstruction] = useState<{
    step: string;
    description: string;
    imageUri: string | null;
  }>({
    step: '',
    description: '',
    imageUri: null,
  });
  const [editingInstruction, setEditingInstruction] = useState<any>(null);
  const [editInstructionData, setEditInstructionData] = useState<{
    description: string;
    imageUri: string | null;
  }>({
    description: '',
    imageUri: null,
  });
  const [isReordering, setIsReordering] = useState(false);
  const [showImportModal, setShowImportModal] = useState(showImportOnMount);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Calculate section completion status - use useMemo to ensure reactivity
  const sectionCompletion = React.useMemo(() => ({
    info: (): boolean => {
      // Info section: Recipe Photo + Recipe Title
      const hasPhoto = !!recipeData.imageUri;
      const hasTitle = recipeData.title && recipeData.title.trim().length > 0;
      return hasPhoto && hasTitle;
    },
    details: (): boolean => {
      // Details section: Cooking Time + Servings + Main Cookware (all required)
      const hasCookingTime = recipeData.cookingTime && String(recipeData.cookingTime).trim().length > 0;
      const hasServings = recipeData.servings && (
        Array.isArray(recipeData.servings) 
          ? recipeData.servings.length > 0 
          : String(recipeData.servings).trim().length > 0
      );
      const hasCookware = recipeData.cookware && recipeData.cookware.trim().length > 0;
      const isComplete = hasCookingTime && hasServings && hasCookware;
      return isComplete;
    },
    ingredients: (): boolean => {
      // Ingredients section: at least one ingredient required
      // Check both recipeData.ingredients and ingredients state to ensure sync
      const recipeIngredients = recipeData.ingredients || [];
      const stateIngredients = ingredients || [];
      const hasIngredients = (recipeIngredients.length > 0) || (stateIngredients.length > 0);
      return hasIngredients;
    },
    instructions: (): boolean => {
      // Instructions section: at least one instruction required
      // Check both recipeData.instructions and instructions state to ensure sync
      const recipeInstructions = recipeData.instructions || [];
      const stateInstructions = instructions || [];
      const hasInstructions = (recipeInstructions.length > 0) || (stateInstructions.length > 0);
      return hasInstructions;
    },
  }), [recipeData, ingredients, instructions]);
  
  // Calculate overall progress percentage - use useMemo to ensure reactivity
  const { completedSections, progressPercentage } = React.useMemo(() => {
    const completed = [
      sectionCompletion.info(),
      sectionCompletion.details(),
      sectionCompletion.ingredients(),
      sectionCompletion.instructions(),
    ].filter(Boolean).length;
    
    return {
      completedSections: completed,
      progressPercentage: (completed / 4) * 100,
    };
  }, [sectionCompletion]);
  
  // Auto-open import modal if requested
  useEffect(() => {
    if (showImportOnMount) {
      setShowImportModal(true);
    }
  }, [showImportOnMount]);

  // Handle imported recipe data
  // Backend now returns complete Recipe schema with all fields (ID, timestamps, ingredients, instructions, etc.)
  useEffect(() => {
    if (importedRecipe) {
      console.log('📥 Received imported recipe from backend:', importedRecipe);
      
      // Backend already provides complete Recipe schema with:
      // - id, createdAt, updatedAt, isPublic
      // - ingredients with IDs
      // - instructions with IDs
      // - all other fields properly formatted
      
      // Update recipe data with imported content
      // Note: Empty strings are allowed for draft saving, only update if imported value exists
      // Priority: scannedImageUri > importedRecipe.imageUri > importedRecipe.image_url > prev.imageUri
      setRecipeData((prev: any) => ({
        ...prev,
        title: importedRecipe.title || prev.title,
        description: importedRecipe.description || prev.description,
        imageUri: scannedImageUri || importedRecipe.imageUri || importedRecipe.image_url || prev.imageUri,
        // For schema imports (direct import without AI), tags should ALWAYS be empty array
        // Backend should already return empty tags for schema imports, but we enforce it here as well
        // For AI imports, limit tags to maximum 3 (even if backend returns more)
        tags: (() => {
          const importedTags = importedRecipe.tags;
          // If tags is empty/undefined/null, use empty array (schema import)
          if (!importedTags || (Array.isArray(importedTags) && importedTags.length === 0)) {
            return []; // Empty array for schema imports
          }
          // If tags exist, it might be from AI import
          // CRITICAL: Limit to maximum 3 tags for AI imports (even if backend returns more)
          if (Array.isArray(importedTags)) {
            if (importedTags.length > 3) {
              const limitedTags = importedTags.slice(0, 3);
              console.log(`⚠️  Imported recipe has ${importedTags.length} tags, limiting to 3: ${JSON.stringify(limitedTags)}`);
              return limitedTags;
            }
            console.log(`✅ Imported recipe has ${importedTags.length} tags: ${JSON.stringify(importedTags)}`);
            return importedTags;
          }
          return [];
        })(),
        // Allow empty strings for draft saving - only update if imported value exists
        // When importing from schema (without AI), cookingTime should be a number (minutes)
        // Convert to pure numeric string (e.g., 30 -> "30", not "30 minutes")
        cookingTime: importedRecipe.cookingTime !== undefined && importedRecipe.cookingTime !== null 
          ? (typeof importedRecipe.cookingTime === 'number' 
              ? String(importedRecipe.cookingTime) 
              : (typeof importedRecipe.cookingTime === 'string' 
                  ? importedRecipe.cookingTime.replace(/[^0-9]/g, '') // Remove non-numeric characters
                  : String(importedRecipe.cookingTime || '').replace(/[^0-9]/g, '')))
          : prev.cookingTime,
        // When importing from schema (without AI), servings should be a number (people)
        // If servings is 0, undefined, null, or > 20, leave it empty (parsing error)
        servings: (() => {
          const servingsValue = importedRecipe.servings;
          // Check if servings is invalid (null, undefined, 0, or > 20)
          if (servingsValue === undefined || servingsValue === null || servingsValue === 0) {
            return prev.servings; // Keep previous value (empty)
          }
          // If it's a number > 20, treat as parsing error
          if (typeof servingsValue === 'number' && servingsValue > 20) {
            console.log(`⚠️  Servings ${servingsValue} > 20, treating as parsing error, leaving empty`);
            return prev.servings; // Keep previous value (empty)
          }
          // Convert valid servings to string
          if (typeof servingsValue === 'number') {
            return String(servingsValue);
          } else if (Array.isArray(servingsValue)) {
            return String(servingsValue[0] || '').replace(/[^0-9]/g, '');
          } else if (typeof servingsValue === 'string') {
            const numericValue = servingsValue.replace(/[^0-9]/g, '');
            const num = parseInt(numericValue, 10);
            // If parsed number > 20, treat as parsing error
            if (!isNaN(num) && num > 20) {
              console.log(`⚠️  Servings string "${servingsValue}" parsed to ${num} > 20, treating as parsing error, leaving empty`);
              return prev.servings; // Keep previous value (empty)
            }
            return numericValue;
          }
          return prev.servings; // Keep previous value (empty)
        })(),
        cookware: fromChallenge 
          ? 'Chef iQ Mini Oven' 
          : (importedRecipe.cookware !== undefined && importedRecipe.cookware !== null 
              ? importedRecipe.cookware 
              : prev.cookware),
        // Preserve YouTube videos if available
        youtubeVideos: importedRecipe.youtubeVideos || prev.youtubeVideos,
        youtubeSearchUrl: importedRecipe.youtubeSearchUrl || prev.youtubeSearchUrl,
      }));

      // Backend already provides ingredients and instructions with proper IDs
      // Just use them directly
      const importedIngredients = importedRecipe.ingredients || [];
      const importedInstructions = importedRecipe.instructions || [];
      
      console.log('📦 Setting imported data:', {
        ingredientsCount: importedIngredients.length,
        instructionsCount: importedInstructions.length,
        ingredients: importedIngredients,
        instructions: importedInstructions,
      });
      
      // First update state
      setIngredients(importedIngredients);
      setInstructions(importedInstructions);

      // Then update recipeData (ensure synchronization)
      setRecipeData((prev: any) => ({
        ...prev,
        ingredients: importedIngredients,
        instructions: importedInstructions,
      }));

      Alert.alert('Success', 'Recipe imported successfully! Please review and edit as needed.');
    }
  }, [importedRecipe]);

  // Sync ingredients and instructions to recipeData whenever they change
  // This ensures they are always saved correctly
  useEffect(() => {
    setRecipeData((prev: any) => ({
      ...prev,
      ingredients: ingredients,
      instructions: instructions,
    }));
  }, [ingredients, instructions]);

  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const tagInputRef = useRef<TextInput>(null);
  const recipeInfoSectionRef = useRef<View>(null);
  const recipePhotoSectionRef = useRef<View>(null);
  const recipeTagsSectionRef = useRef<View>(null);
  const cookingDetailsSectionRef = useRef<View>(null);
  const ingredientsSectionRef = useRef<View>(null);
  const instructionsSectionRef = useRef<View>(null);
  
  // Store section positions for accurate scrolling
  const sectionPositions = useRef<{ [key: string]: number }>({});

  const categories = ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Other'];
  
  const commonTags = [
    'Quick & Easy', 'Healthy', 'Vegetarian', 'Vegan', 'Gluten-Free',
    'Low-Carb', 'High-Protein', 'Comfort Food', 'Spicy', 'Sweet',
    'Savory', 'Crispy', 'Creamy', 'Fresh', 'Homemade',
    'Traditional', 'Modern', 'Fusion', 'Mediterranean', 'Asian',
    'Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese'
  ];

  const popularIngredients = [
    'Flour', 'Sugar', 'Salt', 'Pepper', 'Butter',
    'Eggs', 'Milk', 'Olive Oil', 'Garlic', 'Onion',
    'Tomato', 'Chicken', 'Rice', 'Pasta', 'Cheese', 'Potato'
  ];


  const cookwareOptions = [
    'Stovetop – Pan or Pot',
    'Air Fryer',
    'Oven',
    'Grill',
    'Slow Cooker',
    'Pressure Cooker',
    'Wok',
    'Other'
  ];

  const UNIT_OPTIONS = [
    // Volume
    { value: 'tsp', label: 'teaspoon (tsp)', category: 'Volume' },
    { value: 'tbsp', label: 'tablespoon (tbsp)', category: 'Volume' },
    { value: 'fl oz', label: 'fluid ounce (fl oz)', category: 'Volume' },
    { value: 'c', label: 'cup (c)', category: 'Volume' },
    { value: 'pt', label: 'pint (pt)', category: 'Volume' },
    { value: 'qt', label: 'quart (qt)', category: 'Volume' },
    { value: 'gal', label: 'gallon (gal)', category: 'Volume' },
    // Weight
    { value: 'oz', label: 'ounce (oz)', category: 'Weight' },
    { value: 'lb', label: 'pound (lb)', category: 'Weight' },
    // Temperature
    { value: '°F', label: 'Fahrenheit (°F)', category: 'Temperature' },
    // Length
    { value: 'in', label: 'inch (in)', category: 'Length' },
    { value: 'ft', label: 'foot (ft)', category: 'Length' },
    // Metric
    { value: 'g', label: 'gram (g)', category: 'Metric' },
    { value: 'ml', label: 'milliliter (ml)', category: 'Metric' },
  ];

const commonIngredientTags = [
  'Chicken', 'Beef', 'Pork', 'Shrimp', 'Salmon', 'Tofu',
  'Eggs', 'Milk', 'Butter', 'Cheddar Cheese', 'Parmesan',
  'Tomato', 'Onion', 'Garlic', 'Bell Pepper', 'Potato',
  'Carrot', 'Broccoli', 'Spinach', 'Mushroom', 'Zucchini',
  'Rice', 'Pasta', 'Quinoa', 'Flour', 'Sugar',
  'Brown Sugar', 'Salt', 'Black Pepper', 'Olive Oil', 'Soy Sauce',
  'Lemon', 'Basil', 'Cilantro', 'Parsley', 'Ginger'
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
      
      // Use file URI directly, don't use base64
      const imageUri = asset.uri;
      console.log('Using file URI:', imageUri);
      setRecipeData((prevData: any) => {
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
      
      // Use file URI directly, don't use base64
      const imageUri = asset.uri;
      console.log('Using file URI:', imageUri);
      setRecipeData((prevData: any) => {
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

  const handleImportRecipe = (importedRecipe: any) => {
    // Backend now returns complete Recipe schema with all fields
    // No conversion needed - use directly
    console.log('📥 Received imported recipe from backend:', importedRecipe);
    
    // Update recipe data with imported content
    setRecipeData((prev: any) => ({
      ...prev,
      title: importedRecipe.title || prev.title,
      description: importedRecipe.description || prev.description,
      imageUri: importedRecipe.imageUri || importedRecipe.image_url || prev.imageUri,
      // For schema imports (direct import without AI), tags should ALWAYS be empty array
      // Backend should already return empty tags for schema imports, but we enforce it here as well
      // For AI imports, limit tags to maximum 3 (even if backend returns more)
      tags: (() => {
        const importedTags = importedRecipe.tags;
        // If tags is empty/undefined/null, use empty array (schema import)
        if (!importedTags || (Array.isArray(importedTags) && importedTags.length === 0)) {
          return []; // Empty array for schema imports
        }
        // If tags exist, it might be from AI import
        // CRITICAL: Limit to maximum 3 tags for AI imports (even if backend returns more)
        if (Array.isArray(importedTags)) {
          if (importedTags.length > 3) {
            const limitedTags = importedTags.slice(0, 3);
            console.log(`⚠️  Imported recipe has ${importedTags.length} tags, limiting to 3: ${JSON.stringify(limitedTags)}`);
            return limitedTags;
          }
          console.log(`✅ Imported recipe has ${importedTags.length} tags: ${JSON.stringify(importedTags)}`);
          return importedTags;
        }
        return [];
      })(),
      // When importing from schema (without AI), convert numbers to pure numeric strings
      cookingTime: importedRecipe.cookingTime !== undefined && importedRecipe.cookingTime !== null
        ? (typeof importedRecipe.cookingTime === 'number' 
            ? String(importedRecipe.cookingTime) 
            : (typeof importedRecipe.cookingTime === 'string' 
                ? importedRecipe.cookingTime.replace(/[^0-9]/g, '')
                : String(importedRecipe.cookingTime || '').replace(/[^0-9]/g, '')))
        : prev.cookingTime,
      // If servings is 0, undefined, null, or > 20, leave it empty (parsing error)
      servings: (() => {
        const servingsValue = importedRecipe.servings;
        // Check if servings is invalid (null, undefined, 0, or > 20)
        if (servingsValue === undefined || servingsValue === null || servingsValue === 0) {
          return prev.servings; // Keep previous value (empty)
        }
        // If it's a number > 20, treat as parsing error
        if (typeof servingsValue === 'number' && servingsValue > 20) {
          console.log(`⚠️  Servings ${servingsValue} > 20, treating as parsing error, leaving empty`);
          return prev.servings; // Keep previous value (empty)
        }
        // Convert valid servings to string
        if (typeof servingsValue === 'number') {
          return String(servingsValue);
        } else if (Array.isArray(servingsValue)) {
          return String(servingsValue[0] || '').replace(/[^0-9]/g, '');
        } else if (typeof servingsValue === 'string') {
          const numericValue = servingsValue.replace(/[^0-9]/g, '');
          const num = parseInt(numericValue, 10);
          // If parsed number > 20, treat as parsing error
          if (!isNaN(num) && num > 20) {
            console.log(`⚠️  Servings string "${servingsValue}" parsed to ${num} > 20, treating as parsing error, leaving empty`);
            return prev.servings; // Keep previous value (empty)
          }
          return numericValue;
        }
        return prev.servings; // Keep previous value (empty)
      })(),
      cookware: importedRecipe.cookware || prev.cookware,
    }));

    // Backend already provides ingredients and instructions with proper IDs
    // Just use them directly
    setIngredients(importedRecipe.ingredients || []);
    setInstructions(importedRecipe.instructions || []);

    // Update recipeData with ingredients and instructions
    setRecipeData((prev: any) => ({
      ...prev,
      ingredients: importedRecipe.ingredients || [],
      instructions: importedRecipe.instructions || [],
    }));

    Alert.alert('Success', 'Recipe imported successfully! Please review and edit as needed.');
  };

  const addTagsFromString = (input: string) => {
    if (!input) return;
    // Support comma/space separated tags, add multiple at once; remove duplicates and empty values
    const pieces = input
      .split(/[\s,]+/)
      .map((t: string) => t.trim())
      .filter(Boolean);
    if (pieces.length === 0) return;
    const existing = new Set((recipeData.tags || []).map((t: string) => t.toLowerCase()));
    const merged: string[] = [...(recipeData.tags || [])];
    const maxTags = 3;
    
    for (const p of pieces) {
      const key = p.toLowerCase();
      if (!existing.has(key)) {
        if (merged.length >= maxTags) {
          Alert.alert('Tag Limit Reached', `You can add a maximum of ${maxTags} tags.`);
          break;
        }
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
    const tagToRemove = recipeData.tags[index];
    const challengeTag = 'Chef iQ Challenge';
    
    // Prevent removal of "Chef iQ Challenge" tag if from challenge
    if (fromChallenge && tagToRemove === challengeTag) {
      Alert.alert(
        'Cannot Remove Tag',
        'The "Chef iQ Challenge" tag cannot be removed for challenge submissions.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const updatedTags = recipeData.tags.filter((_: any, i: number) => i !== index);
    setRecipeData({ ...recipeData, tags: updatedTags });
  };

  const selectTag = (tag: string) => {
    const maxTags = 3;
    const currentTags = recipeData.tags || [];
    
    if (currentTags.length >= maxTags) {
      Alert.alert('Tag Limit Reached', `You can add a maximum of ${maxTags} tags.`);
      setShowTagSuggestions(false);
      return;
    }
    
    if (!currentTags.includes(tag)) {
      setRecipeData({
        ...recipeData,
        tags: [...currentTags, tag]
      });
    }
    setShowTagSuggestions(false);
  };

  const handleCookingTimeChange = (text: string) => {
    // Only allow numeric input
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Limit to maximum 999
    if (numericValue !== '' && parseInt(numericValue, 10) > 999) {
      setRecipeData({ ...recipeData, cookingTime: '999' });
      return;
    }
    
    setRecipeData({ ...recipeData, cookingTime: numericValue });
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

  const selectUnit = (unitValue: string) => {
    setNewIngredient({ ...newIngredient, unit: unitValue });
    setShowUnitDropdown(false);
  };

const handleIngredientTagPress = (ingredientName: string) => {
  if (!ingredientName) return;
  setNewIngredient(prev => ({
    ...prev,
    name: ingredientName,
  }));
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

  // Legacy scrollToSection for input focus (kept for backward compatibility)
  const scrollToSection = (sectionRef: any, offset: number = 0) => {
    if (sectionRef === recipeInfoSectionRef) {
      // Use stored position for recipeInfoSection
      scrollToSectionPosition('recipeInfo', offset);
    } else {
      // Fallback to measureInWindow for other refs
      setTimeout(() => {
        sectionRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          const scrollY = y - 100 + offset;
          scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollY), animated: true });
        });
      }, 100);
    }
  };

  const scrollToInput = (inputRef: any, offset: number = 0) => {
    setTimeout(() => {
      inputRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        const scrollY = y - 100 + offset; // 100px above the input
        scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollY), animated: true });
      });
    }, 100);
  };

  // Measure section position using onLayout
  const measureSection = (sectionKey: string, y: number) => {
    sectionPositions.current[sectionKey] = y;
  };

  // Scroll to section using stored position
  const scrollToSectionPosition = (sectionKey: string, offset: number = 120) => {
    const position = sectionPositions.current[sectionKey];
    if (position !== undefined && scrollViewRef.current) {
      // Account for progress bar height (approximately 100px) and add offset
      const scrollY = position - offset;
      scrollViewRef.current.scrollTo({ y: Math.max(0, scrollY), animated: true });
    }
  };

  // Scroll to specific sections
  const scrollToInfo = () => {
    scrollToSectionPosition('recipePhoto', 120);
  };

  const scrollToDetails = () => {
    scrollToSectionPosition('cookingDetails', 120);
  };

  const scrollToIngredients = () => {
    scrollToSectionPosition('ingredients', 120);
  };

  const scrollToInstructions = () => {
    scrollToSectionPosition('instructions', 120);
  };

  // Close all dropdowns when clicking outside
  const closeAllDropdowns = () => {
    setShowCookwareDropdown(false);
    setShowUnitDropdown(false);
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
    // Draft validation: only title is required, other fields can be missing
    if (!validateRecipe(false)) {
      return; // At least title is required
    }
    
    // Draft save: allow some fields to be empty, user can complete them later
    saveRecipeDataWithVisibility(false);
    Alert.alert('Success', 'Recipe saved as draft. You can complete missing fields later.', [
      { text: 'OK', onPress: () => navigation.navigate('RecipeList') },
    ]);
  };

  // Function to validate recipe data
  // isPublish: true means publish validation (requires complete data), false means draft validation (allows partial data)
  const validateRecipe = (isPublish: boolean = false) => {
    // Use the latest value from ref
    const currentRecipeData = recipeDataRef.current;
    
    // Debug logging
    console.log(`Validation (${isPublish ? 'Publish' : 'Draft'}) - Full recipeData object:`, JSON.stringify(currentRecipeData, null, 2));
    
    // 1. Validate title (required for both publish and draft)
    if (!currentRecipeData.title || currentRecipeData.title.trim() === '') {
      Alert.alert('Validation Error', 'Recipe title is required. Please enter a title for your recipe.');
      return false;
    }

    // Draft mode: only title required, other fields can be missing
    if (!isPublish) {
      console.log('✅ Draft validation: Only title required, other fields can be empty');
      return true;
    }

    // Publish mode: all fields must be complete
    const missingFields: string[] = [];

    // 2. Validate recipe photo
    if (!currentRecipeData.imageUri) {
      missingFields.push('Recipe Photo');
    }

    // 3. Validate cooking time
    const cookingTime = typeof currentRecipeData.cookingTime === 'string' 
      ? currentRecipeData.cookingTime.trim() 
      : String(currentRecipeData.cookingTime || '').trim();
    if (!cookingTime) {
      missingFields.push('Cooking Time');
    }

    // 4. Validate servings (handle case where it might be an array)
    // Servings must be between 1 and 20 (People)
    let servingsValue = '';
    if (Array.isArray(currentRecipeData.servings)) {
      servingsValue = currentRecipeData.servings.join(', ').trim();
    } else if (typeof currentRecipeData.servings === 'string') {
      servingsValue = currentRecipeData.servings.trim();
    } else if (currentRecipeData.servings !== undefined && currentRecipeData.servings !== null) {
      servingsValue = String(currentRecipeData.servings).trim();
    }
    if (!servingsValue) {
      missingFields.push('Servings');
    } else {
      // Check if servings is within valid range (1-20)
      const servingsNum = parseInt(servingsValue, 10);
      if (isNaN(servingsNum) || servingsNum < 1 || servingsNum > 20) {
        Alert.alert(
          'Invalid Servings',
          'Servings must be a number between 1 and 20 (People). Please enter a valid number.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }

    // 5. Validate at least one ingredient
    if (!currentRecipeData.ingredients || currentRecipeData.ingredients.length === 0) {
      missingFields.push('Ingredients (at least one)');
    }

    // 6. Validate at least one instruction
    if (!currentRecipeData.instructions || currentRecipeData.instructions.length === 0) {
      missingFields.push('Instructions (at least one)');
    }

    // If there are missing fields, show error
    if (missingFields.length > 0) {
      const fieldsList = missingFields.join(', ');
      Alert.alert(
        'Cannot Publish Recipe',
        `Please complete the following required fields before publishing:\n\n${fieldsList}\n\nYou can save as draft and complete later.`,
        [
          { text: 'Save as Draft Instead', onPress: () => handleSaveAsDraft() },
          { text: 'OK', style: 'cancel' }
        ]
      );
      return false;
    }

    return true;
  };

  const handlePublishRecipe = () => {
    // Use setTimeout to ensure state is updated
    setTimeout(() => {
      // Publish validation: requires complete data
      if (!validateRecipe(true)) {
        return; // Validation failed, don't continue
      }
      
      // Validation passed, continue with save process
      saveRecipeDataWithVisibility(true);
    }, 200); // Increase delay to ensure state update
  };

  const saveRecipeDataWithVisibility = (isPublic: boolean) => {
    // Use the latest value from ref
    const currentRecipeData = recipeDataRef.current;

    // Prepare tags array - add "Chef iQ Challenge" tag if from challenge
    const currentTags = currentRecipeData.tags || [];
    const challengeTag = 'Chef iQ Challenge';
    let tagsToSave = [...currentTags];
    
    // Add challenge tag if from challenge and not already present
    if (fromChallenge && !tagsToSave.includes(challengeTag)) {
      tagsToSave.push(challengeTag);
    }

    // Key fix: prioritize data from recipeData, as state updates may not be complete yet
    // If recipeData doesn't have it, use state as fallback
    // This ensures imported data is saved correctly
    const recipeDataToSave = {
      ...currentRecipeData,
      isPublic, // Determined by caller (publish=true; draft=false)
      items,
      // Force cookware to "Chef iQ Mini Oven" if from challenge
      cookware: fromChallenge ? 'Chef iQ Mini Oven' : currentRecipeData.cookware,
      // Add challenge tag if from challenge
      tags: tagsToSave,
      // Prioritize data from recipeData (includes imported data), use state if empty
      ingredients: (currentRecipeData.ingredients && currentRecipeData.ingredients.length > 0) 
        ? currentRecipeData.ingredients 
        : ingredients,
      instructions: (currentRecipeData.instructions && currentRecipeData.instructions.length > 0)
        ? currentRecipeData.instructions
        : instructions,
    };

    // Debug logging
    console.log('💾 Saving recipe with data:', {
      title: recipeDataToSave.title,
      description: recipeDataToSave.description,
      ingredientsCount: recipeDataToSave.ingredients?.length || 0,
      instructionsCount: recipeDataToSave.instructions?.length || 0,
      cookingTime: recipeDataToSave.cookingTime,
      servings: recipeDataToSave.servings,
      tagsCount: recipeDataToSave.tags?.length || 0,
      imageUri: recipeDataToSave.imageUri ? 'Has image' : 'No image',
      isPublic: recipeDataToSave.isPublic
    });
    
    // Detailed debug logging
    console.log('📋 Full recipeDataToSave object:', JSON.stringify(recipeDataToSave, null, 2));
    console.log('🥘 Ingredients details:', recipeDataToSave.ingredients);
    console.log('📝 Instructions details:', recipeDataToSave.instructions);
    
    // Validate that ingredients and instructions exist
    if (!recipeDataToSave.ingredients || recipeDataToSave.ingredients.length === 0) {
      console.warn('⚠️ WARNING: No ingredients in recipeDataToSave!');
    }
    if (!recipeDataToSave.instructions || recipeDataToSave.instructions.length === 0) {
      console.warn('⚠️ WARNING: No instructions in recipeDataToSave!');
    }
    
    // Validate ingredients and instructions in state
    console.log('🔍 State check:', {
      ingredientsStateLength: ingredients.length,
      instructionsStateLength: instructions.length,
      ingredientsState: ingredients,
      instructionsState: instructions,
    });

    let savedRecipe: any;
    if (isEditing && existingRecipe) {
      const updatedRecipe = {
        ...existingRecipe,
        ...recipeDataToSave,
      };
      updateRecipe(updatedRecipe);
      savedRecipe = updatedRecipe;
    } else {
      // Call addRecipe method, which returns the created recipe object
      console.log('➕ Creating new recipe - passing to addRecipe:', {
        title: recipeDataToSave.title,
        ingredientsCount: recipeDataToSave.ingredients?.length || 0,
        instructionsCount: recipeDataToSave.instructions?.length || 0,
        ingredients: recipeDataToSave.ingredients,
        instructions: recipeDataToSave.instructions,
      });
      savedRecipe = addRecipe(recipeDataToSave);
      
      // Award points for creating recipe (using current ID, if ID updates after sync, points record might have issues, but this is minor)
      addPoints('create_recipe', `Created recipe: ${savedRecipe.title}`, savedRecipe.id).catch(err => console.error('Failed to add points:', err));
      
      // Check for badge unlocks after publishing
      setTimeout(async () => {
        const unlocked = await checkBadgeUnlock('first_recipe');
        if (unlocked) {
          const badge = getBadgeById('first_recipe');
          if (badge) {
            Alert.alert(
              '🎉 Badge Unlocked!',
              `You earned the "${badge.name}" badge!\n\n${badge.description}`,
              [{ text: 'Awesome!' }]
            );
          }
        }
        // Check for recipe count badges
        await checkBadgeUnlock('recipe_creator_10');
        await checkBadgeUnlock('recipe_creator_50');
        
        // Check for Chef iQ Challenge badge
        if (fromChallenge || savedRecipe.tags?.includes('Chef iQ Challenge')) {
          const challengeUnlocked = await checkBadgeUnlock('chef_iq_champion');
          if (challengeUnlocked) {
            const badge = getBadgeById('chef_iq_champion');
            if (badge) {
              Alert.alert(
                '🏆 Badge Unlocked!',
                `You earned the "${badge.name}" badge!\n\n${badge.description}`,
                [{ text: 'Awesome!' }]
              );
            }
          }
        }
      }, 500);
    }

    // Debug logging after save
    console.log('✅ Recipe saved successfully:', {
      id: savedRecipe.id,
      title: savedRecipe.title,
      ingredientsCount: savedRecipe.ingredients?.length || 0,
      instructionsCount: savedRecipe.instructions?.length || 0,
      imageUri: savedRecipe.imageUri ? 'Has image' : 'No image',
      hasIngredients: !!savedRecipe.ingredients && savedRecipe.ingredients.length > 0,
      hasInstructions: !!savedRecipe.instructions && savedRecipe.instructions.length > 0,
    });
    
    // Validate saved data
    if (!savedRecipe.ingredients || savedRecipe.ingredients.length === 0) {
      console.error('❌ CRITICAL: savedRecipe has no ingredients!');
      console.error('savedRecipe:', JSON.stringify(savedRecipe, null, 2));
    }
    if (!savedRecipe.instructions || savedRecipe.instructions.length === 0) {
      console.error('❌ CRITICAL: savedRecipe has no instructions!');
      console.error('savedRecipe:', JSON.stringify(savedRecipe, null, 2));
    }

    // Navigate directly to recipe preview page and set return target to My Recipe
    // Note: addRecipe internally triggers sync, but sync is asynchronous
    // We wait a bit for sync to complete, then get updated recipe ID from context
    // If not found, sync hasn't completed yet, use local ID for navigation (will refresh from cloud later)
    const originalId = savedRecipe.id;
    const isUUID = originalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(originalId);
    
    if (user && !isEditing && !isUUID) {
      // Newly created recipe (timestamp ID), wait for sync to complete, then get updated ID from context
      // Note: Don't call syncRecipe again, as addRecipe already called it internally
      setTimeout(() => {
        // Try to get latest recipe from context (ID might have been updated to database UUID)
        const latestRecipe = getRecipeById(originalId);
        // If found and ID updated, use new ID; otherwise try to find by title
        let recipeIdToUse = latestRecipe?.id || originalId;
        
        // If not found by original ID or ID is still timestamp, try to find latest recipe by title
        if (!latestRecipe || latestRecipe.id === originalId) {
          // Find all recipes with same title, select the newest (largest createdAt) with UUID ID
          const recipesByTitle = state.recipes.filter((r: Recipe) => r.title === savedRecipe.title);
          if (recipesByTitle.length > 0) {
            // Prioritize recipes with UUID ID (synced to database), then select newest by createdAt
            const uuidRecipes = recipesByTitle.filter((r: Recipe) => 
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id)
            );
            
            if (uuidRecipes.length > 0) {
              // If UUID recipes exist, select the newest by createdAt
              const newestUUIDRecipe = uuidRecipes.reduce((latest, current) => {
                const latestDate = new Date(latest.createdAt).getTime();
                const currentDate = new Date(current.createdAt).getTime();
                return currentDate > latestDate ? current : latest;
              });
              recipeIdToUse = newestUUIDRecipe.id;
              console.log('🔍 Found latest UUID recipe ID by title:', recipeIdToUse);
            } else {
              // If no UUID recipes, select the newest by createdAt
              const newestRecipe = recipesByTitle.reduce((latest, current) => {
                const latestDate = new Date(latest.createdAt).getTime();
                const currentDate = new Date(current.createdAt).getTime();
                return currentDate > latestDate ? current : latest;
              });
              if (newestRecipe.id !== originalId) {
                recipeIdToUse = newestRecipe.id;
                console.log('🔍 Found latest recipe ID by title:', recipeIdToUse);
              }
            }
          }
        }
        
        console.log('🧭 Navigating to RecipeDetail:', {
          originalId: originalId,
          latestId: latestRecipe?.id,
          usingId: recipeIdToUse,
          idChanged: recipeIdToUse !== originalId,
        });
        
        // Check if this is from challenge and recipe is published
        if (fromChallenge && isPublic) {
          // Show challenge participation success message
          Alert.alert(
            '🎉 Challenge Participation Success!',
            'Congratulations! Your recipe has been submitted to the Chef iQ Challenge. Good luck!',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.navigate('RecipeDetail', { 
                    recipeId: recipeIdToUse,
                    returnTo: 'RecipeList'
                  });
                }
              }
            ]
          );
        } else {
          navigation.navigate('RecipeDetail', { 
            recipeId: recipeIdToUse,
            returnTo: 'RecipeList'
          });
        }
      }, 1000); // Increase to 1000ms to ensure sync and ID update complete
    } else {
      // Edit mode, no user, or already UUID, navigate directly
      // Check if this is from challenge and recipe is published
      if (fromChallenge && isPublic) {
        // Show challenge participation success message
        Alert.alert(
          '🎉 Challenge Participation Success!',
          'Congratulations! Your recipe has been submitted to the Chef iQ Challenge. Good luck!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('RecipeDetail', { 
                  recipeId: savedRecipe.id,
                  returnTo: 'RecipeList'
                });
              }
            }
          ]
        );
      } else {
        navigation.navigate('RecipeDetail', { 
          recipeId: savedRecipe.id,
          returnTo: 'RecipeList'
        });
      }
    }
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

  // Check if any dropdown is open
  const isAnyDropdownOpen = showCookwareDropdown || showUnitDropdown;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 50}
      >
        {/* Overlay to close dropdowns when clicking outside */}
        {isAnyDropdownOpen && Platform.OS === 'ios' && (
          <TouchableWithoutFeedback onPress={closeAllDropdowns}>
            <View style={styles.dropdownOverlay} />
          </TouchableWithoutFeedback>
        )}
        {/* Progress Bar - Fixed at top below header */}
        <View style={styles.progressBarContainer}>
          {/* Progress Bar with Dots - 4 equal segments */}
          <View style={styles.progressBarWrapper}>
            {/* Four equal segments */}
            <View style={styles.progressSegments}>
              {/* Segment 1: Info */}
              <TouchableOpacity 
                style={[styles.progressSegment, styles.progressSegmentFirst]}
                onPress={scrollToInfo}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.progressSegmentFill,
                  sectionCompletion.info() && styles.progressSegmentFillActive,
                  sectionCompletion.info() && styles.progressSegmentFillFirst
                ]} />
                <View style={[
                  styles.progressDot,
                  sectionCompletion.info() && styles.progressDotActive
                ]}>
                  {sectionCompletion.info() && (
                    <Ionicons name="checkmark" size={8} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              
              {/* Segment 2: Details */}
              <TouchableOpacity 
                style={styles.progressSegment}
                onPress={scrollToDetails}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.progressSegmentFill,
                  sectionCompletion.details() && styles.progressSegmentFillActive
                ]} />
                <View style={[
                  styles.progressDot,
                  sectionCompletion.details() && styles.progressDotActive
                ]}>
                  {sectionCompletion.details() && (
                    <Ionicons name="checkmark" size={8} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              
              {/* Segment 3: Ingredients */}
              <TouchableOpacity 
                style={styles.progressSegment}
                onPress={scrollToIngredients}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.progressSegmentFill,
                  sectionCompletion.ingredients() && styles.progressSegmentFillActive
                ]} />
                <View style={[
                  styles.progressDot,
                  sectionCompletion.ingredients() && styles.progressDotActive
                ]}>
                  {sectionCompletion.ingredients() && (
                    <Ionicons name="checkmark" size={8} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              
              {/* Segment 4: Instructions */}
              <TouchableOpacity 
                style={[styles.progressSegment, styles.progressSegmentLast]}
                onPress={scrollToInstructions}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.progressSegmentFill,
                  sectionCompletion.instructions() && styles.progressSegmentFillActive,
                  sectionCompletion.instructions() && styles.progressSegmentFillLast
                ]} />
                <View style={[
                  styles.progressDot,
                  sectionCompletion.instructions() && styles.progressDotActive
                ]}>
                  {sectionCompletion.instructions() && (
                    <Ionicons name="checkmark" size={8} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Section Labels */}
          <View style={styles.progressSections}>
            <TouchableOpacity 
              style={styles.progressSectionLabelContainer}
              onPress={scrollToInfo}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.progressSectionLabel,
                sectionCompletion.info() && styles.progressSectionLabelActive
              ]}>Info</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.progressSectionLabelContainer}
              onPress={scrollToDetails}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.progressSectionLabel,
                sectionCompletion.details() && styles.progressSectionLabelActive
              ]}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.progressSectionLabelContainer}
              onPress={scrollToIngredients}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.progressSectionLabel,
                sectionCompletion.ingredients() && styles.progressSectionLabelActive
              ]}>Ingredients</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.progressSectionLabelContainer}
              onPress={scrollToInstructions}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.progressSectionLabel,
                sectionCompletion.instructions() && styles.progressSectionLabelActive
              ]}>Instructions</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          nestedScrollEnabled={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isAnyDropdownOpen}
          scrollEventThrottle={16}
          onScrollBeginDrag={(evt) => {
            // Only close dropdowns if scrolling the main ScrollView, not the dropdown ScrollView
            if (!isAnyDropdownOpen) {
              closeAllDropdowns();
            }
          }}
        >
        {/* Recipe Photo Section */}
        <View 
          ref={recipePhotoSectionRef} 
          style={styles.recipePhotoSection}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            measureSection('recipePhoto', y);
          }}
        >
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
                <Image source={{ uri: typeof recipeData.imageUri === 'string' ? recipeData.imageUri : String(recipeData.imageUri) }} style={styles.recipeImage} />
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

        <View 
          ref={recipeInfoSectionRef} 
          style={styles.recipeInfoSection}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            measureSection('recipeInfo', y);
          }}
        >
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
              onFocus={() => {
                setTimeout(() => {
                  scrollToSectionPosition('recipeInfo', 120);
                }, 100);
              }}
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
              onFocus={() => {
                setTimeout(() => {
                  scrollToSectionPosition('recipeInfo', 120);
                }, 100);
              }}
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

        <View 
          ref={recipeTagsSectionRef}
          style={styles.recipeTagsSection}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            measureSection('recipeTags', y);
          }}
        >
          <Text style={styles.sectionTitle}>Recipe Tags</Text>
          <Text style={styles.sectionSubtitle}>Add tags to help others discover your recipe</Text>
          <View style={styles.tagsContainer}>
            <TextInput
              ref={tagInputRef}
              style={styles.tagInput}
              placeholder="Enter a tag and press Enter"
              value={newTag}
              onChangeText={(text) => {
                // If user entered separator (comma/space), automatically submit current segment
                if (/[\s,]$/.test(text)) {
                  addTagsFromString(text);
                  setNewTag('');
                } else {
                  setNewTag(text);
                }
              }}
              onSubmitEditing={addTag}
              onFocus={() => {
                setTimeout(() => {
                  scrollToSectionPosition('recipeTags', 120);
                }, 100);
              }}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
            <View style={styles.tagSuggestions}>
              <Text style={styles.suggestionsTitle}>Popular Tags:</Text>
              {(() => {
                const filteredTags = commonTags.filter(tag => !recipeData.tags.includes(tag));
                const firstRow = filteredTags.slice(0, Math.ceil(filteredTags.length / 2));
                const secondRow = filteredTags.slice(Math.ceil(filteredTags.length / 2));
                
                return (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.tagSuggestionsScroll}
                    contentContainerStyle={styles.tagSuggestionsContent}
                    nestedScrollEnabled={Platform.OS === 'android'}
                  >
                    <View style={styles.tagSuggestionsRows}>
                      <View style={styles.tagSuggestionsRow}>
                        {firstRow.map((tag, index) => (
                          <TouchableOpacity
                            key={`first-${index}`}
                            style={styles.suggestionTag}
                            onPress={() => selectTag(tag)}
                          >
                            <Text style={styles.suggestionTagText}>{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.tagSuggestionsRow}>
                        {secondRow.map((tag, index) => (
                          <TouchableOpacity
                            key={`second-${index}`}
                            style={styles.suggestionTag}
                            onPress={() => selectTag(tag)}
                          >
                            <Text style={styles.suggestionTagText}>{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                );
              })()}
            </View>
          {recipeData.tags && recipeData.tags.length > 0 && (
            <View style={styles.tagsList}>
              {recipeData.tags.map((tag: string, index: number) => {
                const isChallengeTag = fromChallenge && tag === 'Chef iQ Challenge';
                return (
                  <View key={index} style={[
                    styles.tagItem,
                    isChallengeTag && styles.challengeTagItem
                  ]}>
                    {isChallengeTag && (
                      <Ionicons name="trophy" size={14} color="#FF6B35" style={{ marginRight: 4 }} />
                    )}
                    <Text style={[
                      styles.tagText,
                      isChallengeTag && styles.challengeTagText
                    ]}>{tag}</Text>
                    <TouchableOpacity 
                      onPress={() => removeTag(index)}
                      disabled={isChallengeTag}
                      style={isChallengeTag && styles.disabledButton}
                    >
                      <Ionicons 
                        name="close" 
                        size={16} 
                        color={isChallengeTag ? "#ccc" : "#666"} 
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View 
          ref={cookingDetailsSectionRef} 
          style={styles.cookingDetailsSection}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            measureSection('cookingDetails', y);
          }}
        >
          <Text style={styles.sectionTitle}>Cooking Details</Text>
          
          {/* Cookware Selection */}
          <View style={[styles.inputGroup, styles.cookwareInputGroup, { overflow: Platform.OS === 'android' ? 'visible' : 'visible' }]} pointerEvents="box-none">
            <Text style={styles.requiredLabel}>
              Main Cookware <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            {fromChallenge && (
              <View style={styles.challengeBadge}>
                <Ionicons name="trophy" size={16} color="#FF6B35" />
                <Text style={styles.challengeBadgeText}>Chef iQ Challenge</Text>
              </View>
            )}
            <Pressable
              style={[
                styles.dropdownButton,
                fromChallenge && styles.dropdownButtonDisabled
              ]}
              onPress={() => {
                if (!fromChallenge) {
                  setShowCookwareDropdown(!showCookwareDropdown);
                  setTimeout(() => {
                    scrollToSectionPosition('cookingDetails', 120);
                  }, 100);
                }
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => false}
              disabled={fromChallenge}
              android_ripple={{ color: '#f0f0f0', borderless: false }}
            >
              <Text style={[styles.dropdownText, !recipeData.cookware && styles.placeholderText]}>
                {recipeData.cookware || ''}
              </Text>
              {!fromChallenge && (
                <Ionicons
                  name={showCookwareDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#666"
                />
              )}
              {fromChallenge && (
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color="#999"
                />
              )}
            </Pressable>
            {fromChallenge && (
              <Text style={styles.challengeNote}>
                Cookware is locked to "Chef iQ Mini Oven" for challenge participation
              </Text>
            )}
            {showCookwareDropdown && (
              <View 
                style={[
                  styles.dropdownList, 
                  styles.cookwareDropdownList, 
                  { 
                    position: 'absolute', 
                    top: 60, 
                    left: 0, 
                    right: 0, 
                    zIndex: 999999999, 
                    elevation: Platform.OS === 'android' ? 999999999 : 0,
                    maxHeight: 500
                  }
                ]}
              >
                {Platform.OS === 'android' ? (
                  <ScrollView
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                    bounces={false}
                    style={{ maxHeight: 500 }}
                    contentContainerStyle={{ flexGrow: 0 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {cookwareOptions.map((cookware) => (
                      <TouchableOpacity
                        key={cookware}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setRecipeData((prev: any) => ({ ...prev, cookware }));
                          setShowCookwareDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{cookware}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  ) : (
                  <ScrollView 
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                    bounces={false}
                    style={{ maxHeight: 500 }}
                    contentContainerStyle={{ paddingBottom: 0 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {cookwareOptions.map((cookware) => (
                      <TouchableOpacity
                        key={cookware}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setRecipeData((prev: any) => ({ ...prev, cookware }));
                          setShowCookwareDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{cookware}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
          
          <View style={[styles.row, { overflow: Platform.OS === 'android' ? 'visible' : 'visible' }]}>
            <View style={[styles.inputGroup, styles.cookingTimeInputGroup, { flex: 1, marginRight: 8, overflow: Platform.OS === 'android' ? 'visible' : 'visible' }]}>
              <Text style={styles.requiredLabel}>
                Cooking Time (minutes) <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.servingsInput}
                value={recipeData.cookingTime || ''}
                onChangeText={handleCookingTimeChange}
                keyboardType="numeric"
                onFocus={() => {
                  setTimeout(() => {
                    scrollToSectionPosition('cookingDetails', 120);
                  }, 100);
                }}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.requiredLabel}>
                Servings <Text style={styles.requiredAsterisk}>*</Text>
                {'\n'}
                <Text>(People)</Text>
              </Text>
              <TextInput
                style={styles.servingsInput}
                value={recipeData.servings || ''}
                onChangeText={(text) => {
                  // Only allow numeric input, maximum 20 (People)
                  const numericValue = text.replace(/[^0-9]/g, '');
                  // Limit to maximum 20
                  const limitedValue = numericValue === '' ? '' : String(Math.min(20, parseInt(numericValue, 10) || 0));
                  setRecipeData({ ...recipeData, servings: limitedValue });
                }}
                keyboardType="numeric"
                onFocus={() => {
                  setTimeout(() => {
                    scrollToSectionPosition('cookingDetails', 120);
                  }, 100);
                }}
              />
            </View>
          </View>
        </View>

        <View 
          ref={ingredientsSectionRef} 
          style={styles.ingredientsSection}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            measureSection('ingredients', y);
          }}
        >
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
                  placeholder="e.g., flour"
                  value={newIngredient.name}
                  onChangeText={text => setNewIngredient({ ...newIngredient, name: text })}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollToSectionPosition('ingredients', 120);
                    }, 100);
                  }}
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
                  onFocus={() => {
                    setTimeout(() => {
                      scrollToSectionPosition('ingredients', 120);
                    }, 100);
                  }}
                />
              </View>
              <View style={[styles.ingredientField, { flex: 1.5 }]}>
                <Text style={styles.ingredientLabel}>Unit</Text>
                <View style={styles.unitContainer} pointerEvents="box-none">
                  <Pressable
                    style={styles.unitDropdownButton}
                    onPress={() => {
                      setShowUnitDropdown(!showUnitDropdown);
                      setTimeout(() => {
                        scrollToSectionPosition('ingredients', 120);
                      }, 100);
                    }}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => false}
                    android_ripple={{ color: '#f0f0f0', borderless: false }}
                  >
                    <Text style={[styles.unitDropdownText, !newIngredient.unit && styles.placeholderText]}>
                      {newIngredient.unit 
                        ? UNIT_OPTIONS.find(u => u.value === newIngredient.unit)?.label || newIngredient.unit
                        : 'Unit'}
                    </Text>
                    <Ionicons
                      name={showUnitDropdown ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#666"
                    />
                  </Pressable>
                  {showUnitDropdown && (
                    <View 
                      style={[styles.dropdownList, styles.unitDropdownList, { position: 'absolute', top: 50, left: 0, right: 0, zIndex: 99999999, elevation: Platform.OS === 'android' ? 99999999 : 0, maxHeight: 300 }]}
                    >
                      {Platform.OS === 'android' ? (
                        <ScrollView
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          scrollEnabled={true}
                          bounces={false}
                          style={{ maxHeight: 300 }}
                          contentContainerStyle={{ flexGrow: 0 }}
                          keyboardShouldPersistTaps="handled"
                        >
                          {UNIT_OPTIONS.map((unit) => (
                            <TouchableOpacity
                              key={unit.value}
                              style={styles.dropdownItem}
                              onPress={() => selectUnit(unit.value)}
                            >
                              <Text style={styles.unitDropdownItemText}>{unit.label}</Text>
                              {newIngredient.unit === unit.value && (
                                <Ionicons name="checkmark" size={20} color="#d96709" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : (
                        <ScrollView 
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          scrollEnabled={true}
                          bounces={false}
                          style={{ maxHeight: 300 }}
                          contentContainerStyle={{ paddingBottom: 0 }}
                          keyboardShouldPersistTaps="handled"
                        >
                          {UNIT_OPTIONS.map((unit) => (
                            <TouchableOpacity
                              key={unit.value}
                              style={styles.dropdownItem}
                              onPress={() => selectUnit(unit.value)}
                            >
                              <Text style={styles.unitDropdownItemText}>{unit.label}</Text>
                              {newIngredient.unit === unit.value && (
                                <Ionicons name="checkmark" size={20} color="#d96709" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.ingredientSuggestions}>
              <Text style={styles.ingredientSuggestionsTitle}>Popular:</Text>
              <View style={styles.ingredientSuggestionsGrid}>
                {popularIngredients.map((ingredient, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.ingredientSuggestionChip}
                    onPress={() => setNewIngredient({ ...newIngredient, name: ingredient })}
                  >
                    <Text style={styles.ingredientSuggestionChipText}>{ingredient}</Text>
                  </TouchableOpacity>
                ))}
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

        <View 
          ref={instructionsSectionRef} 
          style={styles.instructionsSection}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            measureSection('instructions', y);
          }}
        >
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
                  onFocus={() => {
                    setTimeout(() => {
                      scrollToSectionPosition('instructions', 120);
                    }, 100);
                  }}
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
                        onFocus={() => {
                          setTimeout(() => {
                            scrollToSectionPosition('instructions', 120);
                          }, 100);
                        }}
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
      
      <ImportRecipeModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportRecipe}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    overflow: 'visible',
  },
  progressBarContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  progressBarWrapper: {
    marginBottom: 8,
    marginHorizontal: 8,
  },
  progressSegments: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 0,
  },
  progressSegment: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 0,
    position: 'relative',
    overflow: 'visible',
  },
  progressSegmentFirst: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  progressSegmentLast: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  progressSegmentFill: {
    height: '100%',
    width: '0%',
    backgroundColor: '#e0e0e0',
    borderRadius: 0,
  },
  progressSegmentFillActive: {
    width: '100%',
    backgroundColor: '#FF6B35',
  },
  progressSegmentFillFirst: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  progressSegmentFillLast: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'absolute',
    top: -4,
    left: '50%',
    transform: [{ translateX: -8 }],
    zIndex: 2,
  },
  progressDotActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  progressSections: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  progressSectionLabelContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  progressSectionLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  progressSectionLabelActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
    overflow: 'visible',
  },
  scrollView: {
    flex: 1,
    overflow: 'visible',
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
    zIndex: 99999,
    overflow: 'visible',
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
    overflow: 'visible',
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
    overflow: 'visible',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#d96709',
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d96709',
    marginLeft: 6,
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
    position: 'relative',
    zIndex: 999999,
    overflow: 'visible',
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
    fontSize: 14,
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
    position: 'relative',
    zIndex: 999999,
    overflow: 'visible',
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
    marginTop: 8,
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
    fontSize: 14,
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
    marginTop: 12,
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
  challengeTagItem: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6B35',
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    color: '#1976d2',
    marginRight: 6,
  },
  challengeTagText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  tagSuggestions: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tagSuggestionsScroll: {
    marginTop: 8,
  },
  tagSuggestionsContent: {
    paddingRight: 8,
  },
  tagSuggestionsRows: {
    flexDirection: 'column',
  },
  tagSuggestionsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    zIndex: 999998,
    elevation: Platform.OS === 'android' ? 999 : 0,
  },
  servingsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    color: '#333',
  },
  cookingTimeHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  dropdownButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.7,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  challengeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 4,
  },
  challengeNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 6,
  },
  dropdownText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999998,
    elevation: Platform.OS === 'android' ? 999998 : 0,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
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
    maxHeight: 500,
    zIndex: 99999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: Platform.OS === 'android' ? 99999999 : 0,
  },
  cookwareInputGroup: {
    zIndex: 999999999,
    elevation: Platform.OS === 'android' ? 999999999 : 0,
  },
  cookingTimeInputGroup: {
    zIndex: 99999999,
    elevation: Platform.OS === 'android' ? 99999999 : 0,
  },
  servingsInputGroup: {
    zIndex: 99999999,
    elevation: Platform.OS === 'android' ? 99999999 : 0,
  },
  cookwareTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    zIndex: 1,
  },
  cookwareTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cookwareTagSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  cookwareTagDisabled: {
    opacity: 0.5,
  },
  cookwareTagPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cookwareTagText: {
    fontSize: 13,
    color: '#666',
  },
  cookwareTagTextSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  cookwareTagTextDisabled: {
    color: '#999',
  },
  selectedCookwareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectedCookwareLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginRight: 8,
  },
  selectedCookwareTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  selectedCookwareText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
  },
  cookwareDropdownList: {
    zIndex: 999999999,
    elevation: Platform.OS === 'android' ? 999999999 : 0,
  },
  cookingTimeDropdownList: {
    zIndex: 99999999,
    elevation: Platform.OS === 'android' ? 99999999 : 0,
  },
  servingsDropdownList: {
    zIndex: 99999999,
    elevation: Platform.OS === 'android' ? 99999999 : 0,
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
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  ingredientForm: {
    marginBottom: 16,
    overflow: 'visible',
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'visible',
  },
  ingredientField: {
    marginBottom: 8,
    overflow: 'visible',
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
  ingredientSuggestionContainer: {
    marginTop: 8,
  },
  ingredientSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ingredientSuggestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  ingredientSuggestionHint: {
    fontSize: 12,
    color: '#999',
  },
  ingredientSuggestionList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  ingredientSuggestionChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientSuggestionChipActive: {
    backgroundColor: '#d96709',
  },
  ingredientSuggestionChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  ingredientSuggestionChipTextActive: {
    color: '#fff',
  },
  ingredientSuggestions: {
    marginTop: 8,
    marginBottom: 16,
  },
  ingredientSuggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  ingredientSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
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
  },
  unitDropdownText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  unitContainer: {
    position: 'relative',
  },
  unitDropdownList: {
    zIndex: 99999999,
    elevation: Platform.OS === 'android' ? 99999999 : 0,
  },
  unitCategoryGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unitCategoryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    textTransform: 'uppercase',
  },
  unitDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unitDropdownItemSelected: {
    backgroundColor: '#FFF3E0',
  },
  unitDropdownItemText: {
    fontSize: 11,
    color: '#333',
    flex: 1,
  },
  unitDropdownItemTextSelected: {
    color: '#FF6B35',
    fontWeight: '600',
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
    fontSize: 14,
    backgroundColor: 'white',
    color: '#333',
  },
  instructionTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
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
  stepNumberTextSmall: {
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
