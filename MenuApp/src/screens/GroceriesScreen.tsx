import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroceries } from '../contexts/GroceriesContext';

interface GroceriesScreenProps {
  navigation: any;
}

// Unit options organized by category
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

const GroceriesScreen: React.FC<GroceriesScreenProps> = ({ navigation }) => {
  const { state, toggleItem, removeItem, removeCategory, clearCompleted, addSingleItem } = useGroceries();
  const [newItem, setNewItem] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Get all categories (recipe titles) with their items
  const categories = useMemo(() => {
    const categoryMap = new Map<string, typeof state.items>();
    state.items.forEach(item => {
      if (!categoryMap.has(item.recipeTitle)) {
        categoryMap.set(item.recipeTitle, []);
      }
      categoryMap.get(item.recipeTitle)!.push(item);
    });
    return Array.from(categoryMap.entries()).map(([title, items]) => ({
      title,
      items,
      completedCount: items.filter(item => item.isCompleted).length,
      totalCount: items.length,
    }));
  }, [state.items]);

  // Get unique category names for dropdown
  const availableCategories = useMemo(() => {
    return Array.from(new Set(state.items.map(item => item.recipeTitle))).sort();
  }, [state.items]);

  // Initialize all categories as expanded
  React.useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(categories.map(cat => cat.title)));
    }
  }, [categories.length]);

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  };

  const addItem = () => {
    if (newItem.trim()) {
      const category = newItemCategory.trim() || 'Manual Items';
      addSingleItem(
        newItem.trim(),
        newItemAmount.trim() || undefined,
        newItemUnit.trim() || undefined,
        category
      );
      setNewItem('');
      setNewItemAmount('');
      setNewItemUnit('');
      setNewItemCategory('');
      setIsNewCategory(false);
      setShowAddForm(false);
      setShowUnitDropdown(false);
      setShowCategoryDropdown(false);
    } else {
      Alert.alert('Error', 'Please enter an item name');
    }
  };

  const handleRemoveCategory = (categoryTitle: string) => {
    Alert.alert(
      'Remove Category',
      `Are you sure you want to remove all items from "${categoryTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCategory(categoryTitle);
            setExpandedCategories(prev => {
              const newSet = new Set(prev);
              newSet.delete(categoryTitle);
              return newSet;
            });
          },
        },
      ]
    );
  };

  const handleClearCompleted = () => {
    Alert.alert(
      'Clear Completed Items',
      'Are you sure you want to remove all completed items?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCompleted }
      ]
    );
  };

  const renderGroceryItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.groceryItem, item.isCompleted && styles.completedItem]}
      onPress={() => toggleItem(item.id)}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, item.isCompleted && styles.completedText]}>
            {item.name}
          </Text>
          {(item.amount || item.unit) && (
            <Text style={styles.itemQuantity}>
              {item.amount} {item.unit}
            </Text>
          )}
        </View>
        <View style={styles.itemActions}>
          <Ionicons
            name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.isCompleted ? '#4CAF50' : '#ccc'}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={(e) => {
              e.stopPropagation();
              removeItem(item.id);
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (category: { title: string; items: any[]; completedCount: number; totalCount: number }) => {
    const isExpanded = expandedCategories.has(category.title);
    const progress = category.totalCount > 0 ? category.completedCount / category.totalCount : 0;

    return (
      <View key={category.title} style={styles.categorySection}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.title)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryHeaderLeft}>
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="#666"
              style={styles.categoryIcon}
            />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categorySubtitle}>
                {category.completedCount}/{category.totalCount} completed
              </Text>
            </View>
          </View>
          <View style={styles.categoryHeaderRight}>
            {progress === 1 && (
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.categoryCheckIcon} />
            )}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
            <TouchableOpacity
              style={styles.removeCategoryButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveCategory(category.title);
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.categoryItems}>
            {category.items.map(renderGroceryItem)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groceries</Text>
        <Text style={styles.headerSubtitle}>Your shopping list</Text>
        {state.items.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearCompleted}>
            <Ionicons name="trash-outline" size={16} color="#F44336" />
            <Text style={styles.clearButtonText}>Clear Completed</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.addItemContainer}>
        {!showAddForm ? (
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => setShowAddForm(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
            <Text style={styles.addItemButtonText}>Add Item</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addItemForm}>
            <TextInput
              style={styles.textInput}
              placeholder="Item name *"
              placeholderTextColor="#999"
              value={newItem}
              onChangeText={setNewItem}
              autoFocus
            />
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.textInput, styles.amountInput]}
                placeholder="Amount"
                placeholderTextColor="#999"
                value={newItemAmount}
                onChangeText={setNewItemAmount}
                keyboardType="numeric"
              />
              <View style={styles.unitContainer}>
                <TouchableOpacity
                  style={[styles.textInput, styles.unitInput, styles.unitDropdown]}
                  onPress={() => {
                    setShowUnitDropdown(!showUnitDropdown);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={[!newItemUnit && styles.placeholderText]}>
                    {newItemUnit 
                      ? UNIT_OPTIONS.find(u => u.value === newItemUnit)?.label || newItemUnit
                      : 'Unit'}
                  </Text>
                  <Ionicons
                    name={showUnitDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {showUnitDropdown && (
                  <View style={styles.unitDropdownList}>
                    <ScrollView 
                      style={styles.unitDropdownScroll}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {Object.entries(
                        UNIT_OPTIONS.reduce((acc, unit) => {
                          if (!acc[unit.category]) {
                            acc[unit.category] = [];
                          }
                          acc[unit.category].push(unit);
                          return acc;
                        }, {} as Record<string, typeof UNIT_OPTIONS>)
                      ).map(([category, units]) => (
                        <View key={category} style={styles.unitCategoryGroup}>
                          <Text style={styles.unitCategoryLabel}>{category}</Text>
                          {units.map((unit) => (
                            <TouchableOpacity
                              key={unit.value}
                              style={[
                                styles.unitDropdownItem,
                                newItemUnit === unit.value && styles.unitDropdownItemSelected
                              ]}
                              onPress={() => {
                                setNewItemUnit(unit.value);
                                setShowUnitDropdown(false);
                              }}
                            >
                              <Text style={[
                                styles.unitDropdownItemText,
                                newItemUnit === unit.value && styles.unitDropdownItemTextSelected
                              ]}>
                                {unit.label}
                              </Text>
                              {newItemUnit === unit.value && (
                                <Ionicons name="checkmark" size={20} color="#FF6B35" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.categoryRow}>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[styles.textInput, styles.categoryDropdown]}
                  onPress={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowUnitDropdown(false);
                  }}
                >
                  <Text style={[!newItemCategory && styles.placeholderText]}>
                    {newItemCategory || 'Category (optional)'}
                  </Text>
                  <Ionicons
                    name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {showCategoryDropdown && (
                  <View style={styles.categoryDropdownList}>
                    <ScrollView 
                      style={styles.categoryDropdownScroll}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      <TouchableOpacity
                        style={[
                          styles.categoryDropdownItem,
                          isNewCategory && styles.categoryDropdownItemSelected
                        ]}
                        onPress={() => {
                          setIsNewCategory(true);
                          setNewItemCategory('');
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={18} color="#FF6B35" style={{ marginRight: 8 }} />
                        <Text style={[
                          styles.categoryDropdownItemText,
                          isNewCategory && styles.categoryDropdownItemTextSelected
                        ]}>
                          Create New Category
                        </Text>
                        {isNewCategory && (
                          <Ionicons name="checkmark" size={20} color="#FF6B35" />
                        )}
                      </TouchableOpacity>
                      {availableCategories.length > 0 && (
                        <>
                          <View style={styles.categoryDivider} />
                          <Text style={styles.categorySectionLabel}>Existing Categories</Text>
                          {availableCategories.map((category) => (
                            <TouchableOpacity
                              key={category}
                              style={[
                                styles.categoryDropdownItem,
                                newItemCategory === category && !isNewCategory && styles.categoryDropdownItemSelected
                              ]}
                              onPress={() => {
                                setNewItemCategory(category);
                                setIsNewCategory(false);
                                setShowCategoryDropdown(false);
                              }}
                            >
                              <Text style={[
                                styles.categoryDropdownItemText,
                                newItemCategory === category && !isNewCategory && styles.categoryDropdownItemTextSelected
                              ]}>
                                {category}
                              </Text>
                              {newItemCategory === category && !isNewCategory && (
                                <Ionicons name="checkmark" size={20} color="#FF6B35" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              {isNewCategory && (
                <TextInput
                  style={[styles.textInput, styles.newCategoryInput]}
                  placeholder="Enter new category name"
                  placeholderTextColor="#999"
                  value={newItemCategory}
                  onChangeText={(text) => {
                    setNewItemCategory(text);
                    setIsNewCategory(true);
                  }}
                />
              )}
            </View>
            <View style={styles.addFormActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddForm(false);
                  setNewItem('');
                  setNewItemAmount('');
                  setNewItemUnit('');
                  setNewItemCategory('');
                  setIsNewCategory(false);
                  setShowUnitDropdown(false);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addFormButton} onPress={addItem}>
                <Text style={styles.addFormButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.length > 0 ? (
          categories.map(renderCategory)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No groceries yet</Text>
            <Text style={styles.emptySubtext}>
              Add ingredients from recipes or manually add items to see them here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addItemContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollView: {
    flex: 1,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  addItemButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '500',
  },
  addItemForm: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    marginBottom: 0,
  },
  unitContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  unitInput: {
    flex: 1,
    marginBottom: 0,
  },
  unitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    color: '#999',
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
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  unitDropdownScroll: {
    maxHeight: 300,
  },
  unitCategoryGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unitCategoryLabel: {
    fontSize: 12,
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
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  unitDropdownItemTextSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  categoryRow: {
    marginTop: 8,
  },
  categoryContainer: {
    position: 'relative',
    zIndex: 999,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  categoryDropdownScroll: {
    maxHeight: 250,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryDropdownItemSelected: {
    backgroundColor: '#FFF3E0',
  },
  categoryDropdownItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  categoryDropdownItemTextSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  categoryDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  categorySectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  newCategoryInput: {
    marginTop: 8,
    marginBottom: 0,
  },
  addFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  addFormButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
  },
  addFormButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Add bottom padding for spacing
  },
  categorySection: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#666',
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCheckIcon: {
    marginRight: 4,
  },
  progressBarContainer: {
    width: 60,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  removeCategoryButton: {
    padding: 4,
    marginLeft: 4,
  },
  categoryItems: {
    padding: 8,
  },
  groceryItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedItem: {
    opacity: 0.6,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    marginLeft: 12,
    padding: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GroceriesScreen;
