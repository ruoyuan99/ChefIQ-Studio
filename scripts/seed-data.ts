// Pure seed data (no require, only string URLs)
export const seedRecipes = [
  {
    title: 'Creamy Mustard Chicken',
    description: 'Tender pan-seared chicken pieces coated in a rich, creamy mustard sauce.',
    image_url:
      'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/Chicken%20in%20Creamy%20Mustard%20Sauce.png',
    cookingTime: '20-30 minutes',
    servings: '4 servings',
    cookware: 'Regular Pan/Pot',
    tags: ['French', 'Creamy', 'Comfort Food', 'Herbs'],
    ingredients: [
      { name: 'Chicken Thighs', amount: '1.5', unit: 'pounds' },
      { name: 'Dijon Mustard', amount: '3', unit: 'tablespoons' },
      { name: 'Heavy Cream', amount: '1', unit: 'cup' },
    ],
    instructions: [
      { description: 'Season chicken thighs and heat butter in a skillet.' },
      { description: 'Sear chicken until golden on both sides.' },
      { description: 'Make the mustard cream sauce and simmer.' },
    ],
  },
  {
    title: 'Asian Stir-Fried Noodles',
    description: 'Golden-brown stir-fried noodles with meat and vegetables.',
    image_url:
      'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/Beef%20chow%20mein.png',
    cookingTime: '15-25 minutes',
    servings: '3-4 servings',
    cookware: 'Wok',
    tags: ['Asian', 'Stir-Fry', 'Comfort Food', 'Quick & Easy'],
    ingredients: [
      { name: 'Fresh Noodles', amount: '1', unit: 'pound' },
      { name: 'Ground Pork', amount: '0.5', unit: 'pound' },
    ],
    instructions: [
      { description: 'Cook noodles and set aside.' },
      { description: 'Stir-fry aromatics, meat, and veggies.' },
      { description: 'Combine with noodles and sauces.' },
    ],
  },
  {
    title: 'Pan-Fried Chicken Patties',
    description: 'Crispy chicken patties with herbs.',
    image_url:
      'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/Chicken%20Rissoles.png',
    cookingTime: '20-30 minutes',
    servings: '4-6 servings',
    cookware: 'Air Fryer',
    tags: ['Comfort Food', 'Crispy', 'Herbs', 'Quick & Easy'],
    ingredients: [{ name: 'Ground Chicken', amount: '1.5', unit: 'pounds' }],
    instructions: [{ description: 'Mix, form patties, pan-fry until golden.' }],
  },
  {
    title: 'Artisan Flatbread Pizza',
    description: 'Rustic flatbread with chili oil and cheese.',
    image_url:
      'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/8%20minute%20Lebanese%20Pizza.png',
    cookingTime: '25-35 minutes',
    servings: '2-4 servings',
    cookware: 'Pizza Oven',
    tags: ['Artisan', 'Spicy', 'Vegetarian', 'Mediterranean'],
    ingredients: [{ name: 'Pizza Dough', amount: '1', unit: 'pound' }],
    instructions: [{ description: 'Prebake dough, top, and finish baking.' }],
  },
  {
    title: 'Blackened Fish Fillets',
    description: 'Spice-crusted fish fillets with herbs.',
    image_url:
      'https://txendredncvrbxnxphbm.supabase.co/storage/v1/object/public/recipe-images/Jerk%20Fish.png',
    cookingTime: '15-25 minutes',
    servings: '2-4 servings',
    cookware: 'Grill',
    tags: ['Spicy', 'Healthy', 'Seafood', 'Cajun'],
    ingredients: [{ name: 'Fish Fillets', amount: '1.5', unit: 'pounds' }],
    instructions: [{ description: 'Blacken and grill fish until cooked through.' }],
  },
];


