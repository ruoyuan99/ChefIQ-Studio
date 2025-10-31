import { Recipe } from '../types';

export const sampleRecipes: (Recipe & { image_url?: string | null })[] = [
  {
    id: 'sample_1',
    title: 'Creamy Mustard Chicken',
    description: 'Tender pan-seared chicken pieces coated in a rich, creamy mustard sauce with whole mustard seeds and fresh herbs. A perfect balance of tangy and savory flavors.',
    items: [
      {
        id: 'item_1',
        name: 'Creamy Mustard Chicken',
        description: 'Pan-seared chicken with creamy mustard sauce',
        price: 18.99,
        category: 'Main Course',
        isAvailable: true
      }
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    isPublic: true,
    shareCode: 'MUST001',
    image_url: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/Chicken%20in%20Creamy%20Mustard%20Sauce.png',
    imageUri: require('../../assets/recipes/Chicken in Creamy Mustard Sauce.png'),
    authorAvatar: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/headshot1.png',
    authorName: 'Chef Marie',
    authorBio: 'Passionate French chef with 15 years of experience in traditional French cuisine.',
    tags: ['French', 'Creamy', 'Comfort Food', 'Herbs'],
    cookingTime: '20-30 minutes',
    servings: '4 servings',
    cookware: 'Regular Pan/Pot',
    ingredients: [
      {
        id: 'ing_1',
        name: 'Chicken Thighs',
        amount: 1.5,
        unit: 'pounds'
      },
      {
        id: 'ing_2',
        name: 'Dijon Mustard',
        amount: 3,
        unit: 'tablespoons'
      },
      {
        id: 'ing_3',
        name: 'Heavy Cream',
        amount: 1,
        unit: 'cup'
      },
      {
        id: 'ing_4',
        name: 'Whole Mustard Seeds',
        amount: 1,
        unit: 'tablespoon'
      },
      {
        id: 'ing_5',
        name: 'Fresh Parsley',
        amount: 2,
        unit: 'tablespoons'
      },
      {
        id: 'ing_6',
        name: 'White Wine',
        amount: 0.5,
        unit: 'cup'
      },
      {
        id: 'ing_7',
        name: 'Shallots',
        amount: 2,
        unit: 'pieces'
      },
      {
        id: 'ing_8',
        name: 'Butter',
        amount: 2,
        unit: 'tablespoons'
      }
    ],
    instructions: [
      {
        id: 'inst_1',
        step: 1,
        description: 'Season chicken thighs with salt and pepper. Heat butter in a large skillet over medium-high heat.',
        imageUri: null
      },
      {
        id: 'inst_2',
        step: 2,
        description: 'Sear chicken thighs skin-side down for 5-6 minutes until golden brown, then flip and cook for 4-5 minutes more.',
        imageUri: null
      },
      {
        id: 'inst_3',
        step: 3,
        description: 'Remove chicken from pan and set aside. Add diced shallots to the same pan and cook until softened.',
        imageUri: null
      },
      {
        id: 'inst_4',
        step: 4,
        description: 'Deglaze pan with white wine, scraping up any browned bits. Let wine reduce by half.',
        imageUri: null
      },
      {
        id: 'inst_5',
        step: 5,
        description: 'Whisk in Dijon mustard, heavy cream, and mustard seeds. Simmer until sauce thickens slightly.',
        imageUri: null
      },
      {
        id: 'inst_6',
        step: 6,
        description: 'Return chicken to pan, spoon sauce over top, and garnish with fresh parsley before serving.',
        imageUri: null
      }
    ]
  },
  {
    id: 'sample_2',
    title: 'Asian Stir-Fried Noodles',
    description: 'Golden-brown stir-fried noodles with ground meat and colorful vegetables in a rich, savory sauce. A hearty and satisfying Asian-inspired dish perfect for any meal.',
    items: [
      {
        id: 'item_2',
        name: 'Asian Stir-Fried Noodles',
        description: 'Stir-fried noodles with meat and vegetables',
        price: 14.99,
        category: 'Main Course',
        isAvailable: true
      }
    ],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    isPublic: true,
    shareCode: 'NOOD002',
    image_url: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/Beef%20chow%20mein.png',
    imageUri: require('../../assets/recipes/Beef chow mein.png'),
    authorAvatar: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/headshot2.png',
    authorName: 'Chef David',
    authorBio: 'Asian cuisine specialist who learned authentic techniques from street vendors in Hong Kong.',
    tags: ['Asian', 'Stir-Fry', 'Comfort Food', 'Quick & Easy'],
    cookingTime: '15-25 minutes',
    servings: '3-4 servings',
    cookware: 'Wok',
    ingredients: [
      {
        id: 'ing_6',
        name: 'Fresh Noodles',
        amount: 1,
        unit: 'pound'
      },
      {
        id: 'ing_7',
        name: 'Ground Pork',
        amount: 0.5,
        unit: 'pound'
      },
      {
        id: 'ing_8',
        name: 'Carrots',
        amount: 2,
        unit: 'pieces'
      },
      {
        id: 'ing_9',
        name: 'Cabbage',
        amount: 2,
        unit: 'cups'
      },
      {
        id: 'ing_10',
        name: 'Green Onions',
        amount: 4,
        unit: 'pieces'
      },
      {
        id: 'ing_11',
        name: 'Soy Sauce',
        amount: 3,
        unit: 'tablespoons'
      },
      {
        id: 'ing_12',
        name: 'Oyster Sauce',
        amount: 2,
        unit: 'tablespoons'
      },
      {
        id: 'ing_13',
        name: 'Sesame Oil',
        amount: 1,
        unit: 'tablespoon'
      },
      {
        id: 'ing_14',
        name: 'Garlic',
        amount: 3,
        unit: 'cloves'
      },
      {
        id: 'ing_15',
        name: 'Ginger',
        amount: 1,
        unit: 'tablespoon'
      }
    ],
    instructions: [
      {
        id: 'inst_6',
        step: 1,
        description: 'Cook noodles according to package directions, drain and set aside.',
        imageUri: null
      },
      {
        id: 'inst_7',
        step: 2,
        description: 'Julienne carrots and shred cabbage. Slice green onions into 2-inch pieces.',
        imageUri: null
      },
      {
        id: 'inst_8',
        step: 3,
        description: 'Heat oil in a large wok or skillet over high heat. Add garlic and ginger, stir-fry for 30 seconds.',
        imageUri: null
      },
      {
        id: 'inst_9',
        step: 4,
        description: 'Add ground pork and cook until browned, breaking it up with a spatula.',
        imageUri: null
      },
      {
        id: 'inst_10',
        step: 5,
        description: 'Add vegetables and stir-fry for 3-4 minutes until crisp-tender.',
        imageUri: null
      },
      {
        id: 'inst_11',
        step: 6,
        description: 'Add noodles, soy sauce, and oyster sauce. Toss everything together until well combined and heated through.',
        imageUri: null
      }
    ]
  },
  {
    id: 'sample_3',
    title: 'Pan-Fried Chicken Patties',
    description: 'Golden-brown, crispy pan-fried chicken patties with fresh herbs mixed throughout. Perfect as a main dish or appetizer, served with ketchup and fresh garnishes.',
    items: [
      {
        id: 'item_3',
        name: 'Pan-Fried Chicken Patties',
        description: 'Crispy chicken patties with herbs',
        price: 12.99,
        category: 'Main Course',
        isAvailable: true
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isPublic: true,
    shareCode: 'PATT003',
    image_url: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/Chicken%20Rissoles.png',
    imageUri: require('../../assets/recipes/Chicken Rissoles.png'),
    authorAvatar: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/headshot3.png',
    authorName: 'Chef Sarah',
    authorBio: 'Home cooking enthusiast who specializes in comfort food and family-friendly recipes.',
    tags: ['Comfort Food', 'Crispy', 'Herbs', 'Quick & Easy'],
    cookingTime: '20-30 minutes',
    servings: '4-6 servings',
    cookware: 'Air Fryer',
    ingredients: [
      {
        id: 'ing_14',
        name: 'Ground Chicken',
        amount: 1.5,
        unit: 'pounds'
      },
      {
        id: 'ing_15',
        name: 'Breadcrumbs',
        amount: 0.5,
        unit: 'cup'
      },
      {
        id: 'ing_16',
        name: 'Egg',
        amount: 1,
        unit: 'piece'
      },
      {
        id: 'ing_17',
        name: 'Fresh Parsley',
        amount: 2,
        unit: 'tablespoons'
      },
      {
        id: 'ing_18',
        name: 'Garlic',
        amount: 2,
        unit: 'cloves'
      },
      {
        id: 'ing_19',
        name: 'Onion',
        amount: 0.25,
        unit: 'cup'
      },
      {
        id: 'ing_20',
        name: 'Salt',
        amount: 1,
        unit: 'teaspoon'
      },
      {
        id: 'ing_21',
        name: 'Black Pepper',
        amount: 0.5,
        unit: 'teaspoon'
      },
      {
        id: 'ing_22',
        name: 'Vegetable Oil',
        amount: 3,
        unit: 'tablespoons'
      }
    ],
    instructions: [
      {
        id: 'inst_11',
        step: 1,
        description: 'Finely chop parsley, garlic, and onion. Mix all ingredients except oil in a large bowl.',
        imageUri: null
      },
      {
        id: 'inst_12',
        step: 2,
        description: 'Form mixture into 6-8 equal-sized patties, about 3 inches in diameter.',
        imageUri: null
      },
      {
        id: 'inst_13',
        step: 3,
        description: 'Heat vegetable oil in a large skillet over medium-high heat.',
        imageUri: null
      },
      {
        id: 'inst_14',
        step: 4,
        description: 'Cook patties for 4-5 minutes per side until golden brown and cooked through.',
        imageUri: null
      },
      {
        id: 'inst_15',
        step: 5,
        description: 'Drain on paper towels and serve hot with ketchup and fresh parsley garnish.',
        imageUri: null
      }
    ]
  },
  {
    id: 'sample_4',
    title: 'Artisan Flatbread Pizza',
    description: 'Rustic flatbread topped with chili oil, creamy cheese, fresh herbs, pine nuts, and red chili flakes. A perfect blend of spicy, creamy, and nutty flavors.',
    items: [
      {
        id: 'item_4',
        name: 'Artisan Flatbread Pizza',
        description: 'Rustic flatbread with chili oil and cheese',
        price: 16.99,
        category: 'Main Course',
        isAvailable: true
      }
    ],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    isPublic: true,
    shareCode: 'FLAT004',
    image_url: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/8%20minute%20Lebanese%20Pizza.png',
    imageUri: require('../../assets/recipes/8 minute Lebanese Pizza.png'),
    authorAvatar: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/headshot4.png',
    authorName: 'Chef Antonio',
    authorBio: 'Mediterranean cuisine expert with a passion for artisanal cooking.',
    tags: ['Artisan', 'Spicy', 'Vegetarian', 'Mediterranean'],
    cookingTime: '25-35 minutes',
    servings: '2-4 servings',
    cookware: 'Pizza Oven',
    ingredients: [
      {
        id: 'ing_23',
        name: 'Pizza Dough',
        amount: 1,
        unit: 'pound'
      },
      {
        id: 'ing_24',
        name: 'Chili Oil',
        amount: 3,
        unit: 'tablespoons'
      },
      {
        id: 'ing_25',
        name: 'Ricotta Cheese',
        amount: 1,
        unit: 'cup'
      },
      {
        id: 'ing_26',
        name: 'Fresh Cilantro',
        amount: 0.5,
        unit: 'cup'
      },
      {
        id: 'ing_27',
        name: 'Pine Nuts',
        amount: 0.25,
        unit: 'cup'
      },
      {
        id: 'ing_28',
        name: 'Red Chili Flakes',
        amount: 1,
        unit: 'teaspoon'
      },
      {
        id: 'ing_29',
        name: 'Olive Oil',
        amount: 2,
        unit: 'tablespoons'
      },
      {
        id: 'ing_30',
        name: 'Salt',
        amount: 1,
        unit: 'teaspoon'
      }
    ],
    instructions: [
      {
        id: 'inst_17',
        step: 1,
        description: 'Preheat oven to 450°F (230°C). Roll out pizza dough on a floured surface.',
        imageUri: null
      },
      {
        id: 'inst_18',
        step: 2,
        description: 'Brush dough with olive oil and bake for 8-10 minutes until lightly golden.',
        imageUri: null
      },
      {
        id: 'inst_19',
        step: 3,
        description: 'Remove from oven and drizzle with chili oil, spreading evenly across the surface.',
        imageUri: null
      },
      {
        id: 'inst_20',
        step: 4,
        description: 'Dollop ricotta cheese in irregular patterns across the flatbread.',
        imageUri: null
      },
      {
        id: 'inst_21',
        step: 5,
        description: 'Sprinkle with fresh cilantro, pine nuts, and red chili flakes.',
        imageUri: null
      },
      {
        id: 'inst_22',
        step: 6,
        description: 'Return to oven for 3-5 minutes until cheese is warmed through. Serve immediately.',
        imageUri: null
      }
    ]
  },
  {
    id: 'sample_5',
    title: 'Blackened Fish Fillets',
    description: 'Perfectly seared fish fillets with a dark, spicy crust and tender white interior. A flavorful dish with a rich spice rub and fresh herb garnish.',
    items: [
      {
        id: 'item_5',
        name: 'Blackened Fish Fillets',
        description: 'Spice-crusted fish fillets with herbs',
        price: 19.99,
        category: 'Main Course',
        isAvailable: true
      }
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    isPublic: true,
    shareCode: 'FISH005',
    image_url: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/Jerk%20Fish.png',
    imageUri: require('../../assets/recipes/Jerk Fish.png'),
    authorAvatar: 'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/headshot5.png',
    authorName: 'Chef Marcus',
    authorBio: 'Seafood specialist and spice master from New Orleans.',
    tags: ['Spicy', 'Healthy', 'Seafood', 'Cajun'],
    cookingTime: '15-25 minutes',
    servings: '2-4 servings',
    cookware: 'Grill',
    ingredients: [
      {
        id: 'ing_31',
        name: 'Fish Fillets',
        amount: 1.5,
        unit: 'pounds'
      },
      {
        id: 'ing_32',
        name: 'Paprika',
        amount: 2,
        unit: 'tablespoons'
      },
      {
        id: 'ing_33',
        name: 'Cayenne Pepper',
        amount: 1,
        unit: 'teaspoon'
      },
      {
        id: 'ing_34',
        name: 'Garlic Powder',
        amount: 1,
        unit: 'teaspoon'
      },
      {
        id: 'ing_35',
        name: 'Onion Powder',
        amount: 1,
        unit: 'teaspoon'
      },
      {
        id: 'ing_36',
        name: 'Dried Thyme',
        amount: 1,
        unit: 'teaspoon'
      },
      {
        id: 'ing_37',
        name: 'Salt',
        amount: 1,
        unit: 'teaspoon'
      },
      {
        id: 'ing_38',
        name: 'Black Pepper',
        amount: 0.5,
        unit: 'teaspoon'
      },
      {
        id: 'ing_39',
        name: 'Butter',
        amount: 4,
        unit: 'tablespoons'
      },
      {
        id: 'ing_40',
        name: 'Fresh Parsley',
        amount: 2,
        unit: 'tablespoons'
      }
    ],
    instructions: [
      {
        id: 'inst_23',
        step: 1,
        description: 'Mix all spices together in a small bowl to create the blackening seasoning.',
        imageUri: null
      },
      {
        id: 'inst_24',
        step: 2,
        description: 'Pat fish fillets dry and generously coat both sides with the spice mixture.',
        imageUri: null
      },
      {
        id: 'inst_25',
        step: 3,
        description: 'Heat a cast-iron skillet over high heat until very hot, about 5 minutes.',
        imageUri: null
      },
      {
        id: 'inst_26',
        step: 4,
        description: 'Add butter to the hot skillet and immediately add fish fillets.',
        imageUri: null
      },
      {
        id: 'inst_27',
        step: 5,
        description: 'Cook for 3-4 minutes per side until the spice crust is dark and fish is cooked through.',
        imageUri: null
      },
      {
        id: 'inst_28',
        step: 6,
        description: 'Garnish with fresh parsley and serve immediately with lemon wedges.',
        imageUri: null
      }
    ]
  }
];
