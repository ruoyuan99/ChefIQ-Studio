# Chef iQ - AI-Powered Recipe Management App

<div align="center">

![Chef iQ Logo](./assets/AppLogo.png)

**Your intelligent cooking companion powered by AI**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.19-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.77.0-green.svg)](https://supabase.com/)

</div>

## 📱 Overview

Chef iQ is a comprehensive recipe management mobile application that combines AI-powered recipe generation, social features, and intelligent cooking assistance. Create, discover, and share recipes with an intuitive interface designed for both novice and experienced cooks.

## ✨ Features

### 🤖 AI-Powered Recipe Generation
- **Generate from Ingredients**: Input your available ingredients and get personalized recipe suggestions
- **Multiple Recipe Options**: Receive 3 unique recipe variations based on your preferences
- **Customizable Preferences**: Set cookware, cooking time, cuisine type, and dietary restrictions
- **YouTube Integration**: Automatically find related cooking videos for each recipe

### 📝 Recipe Management
- **Create Recipes**: Build your own recipes with step-by-step instructions
- **Import Recipes**: Import recipes from websites using URL or text
- **Scan Recipes**: Use AI to extract recipes from images
- **Recipe Organization**: Organize recipes with tags, categories, and favorites

### 👥 Social Features
- **Share Recipes**: Share your creations with the community
- **Social Stats**: Track likes, favorites, and views on your recipes
- **Comments**: Engage with other users through recipe comments
- **Explore**: Discover recipes from the community

### 🏆 Gamification
- **Points System**: Earn points for cooking activities
- **Achievements**: Unlock badges and achievements
- **Chef iQ Challenge**: Participate in cooking challenges
- **Points History**: Track your progress over time

### 🛒 Smart Grocery Lists
- **Auto-Generated Lists**: Create shopping lists from recipes
- **Ingredient Management**: Organize ingredients by category
- **Shopping Assistance**: Never forget an ingredient

### 🎯 Additional Features
- **Step-by-Step Cooking**: Guided cooking with voice instructions
- **Recipe Recommendations**: AI-powered recipe suggestions based on preferences
- **Offline Support**: Access recipes even without internet
- **Image Optimization**: Efficient image handling and compression

## 🛠️ Tech Stack

### Frontend
- **React Native** 0.81.5 - Cross-platform mobile framework
- **Expo** 54.0.19 - Development platform and tooling
- **TypeScript** 5.9.2 - Type-safe JavaScript
- **React Navigation** 7.x - Navigation library
- **React Context API** - State management

### Backend & Services
- **Supabase** - Backend-as-a-Service (Database, Auth, Storage)
- **Express.js** - Backend server for recipe import and AI generation
- **OpenAI API** - AI-powered recipe generation and image scanning
- **YouTube Data API** - Video recommendations

### Key Libraries
- `@expo/vector-icons` - Icon library
- `expo-image` - Optimized image component
- `expo-image-picker` - Image selection
- `expo-speech` - Voice instructions
- `react-native-view-shot` - Recipe card sharing
- `@react-native-async-storage/async-storage` - Local storage

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 22.11.0 or higher
- **npm** or **yarn** package manager
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (for iOS development on macOS)
- **Android Studio** (for Android development)
- **EAS CLI** (for building and deployment): `npm install -g eas-cli`

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Chef iQ RN/MenuApp"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Server (for recipe import and AI generation)
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 4. Start the Backend Server

```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:3001`

### 5. Start the Expo Development Server

```bash
# From the MenuApp directory
npm start
```

Or use platform-specific commands:

```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## 📁 Project Structure

```
MenuApp/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BottomTabNavigator.tsx
│   │   ├── GenerateRecipeModal.tsx
│   │   ├── ImportRecipeModal.tsx
│   │   ├── OptimizedImage.tsx
│   │   └── PointsDisplay.tsx
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── RecipeContext.tsx
│   │   ├── FavoriteContext.tsx
│   │   ├── PointsContext.tsx
│   │   └── ...
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/             # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ExploreScreen.tsx
│   │   ├── FavoriteRecipeScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── GenerateRecipeScreen.tsx
│   │   └── ...
│   ├── services/            # Business logic and API services
│   │   ├── recipeImportService.ts
│   │   ├── realTimeSyncService.ts
│   │   ├── recommendationService.ts
│   │   └── ...
│   ├── styles/              # Theme and styling
│   │   └── theme.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── utils/               # Utility functions
│       ├── imageCompression.ts
│       ├── recipeMatcher.ts
│       └── ...
├── server/                  # Backend server
│   ├── server.js           # Express server
│   └── package.json
├── assets/                  # Images and static assets
├── app.json                 # Expo configuration
├── eas.json                 # EAS Build configuration
├── package.json
└── tsconfig.json
```

## ⚙️ Configuration

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Set up the database schema (see `database/schema.sql`)
4. Configure Row Level Security (RLS) policies

### Backend Server Configuration

Create a `.env` file in the `server/` directory:

```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
YOUTUBE_API_KEY=your_youtube_api_key
```

### iOS Configuration

- Bundle Identifier: `com.chefiq.app`
- Minimum iOS version: 13.0
- Supports iPhone and iPad

### Android Configuration

- Package name: `com.chefiq.app`
- Minimum Android version: API 21 (Android 5.0)
- Target Android version: Latest

## 🧪 Testing

Run tests with:

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

Test files are located in `src/**/__tests__/` directories.

## 🏗️ Building

### Development Build

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Submit to App Stores

```bash
# iOS (TestFlight)
eas submit --platform ios --latest

# Android (Google Play)
eas submit --platform android --latest
```

## 📱 Key Screens

### Main Screens
- **Home**: Main dashboard with quick actions
- **Explore**: Discover recipes from the community
- **Favorites**: Your saved favorite recipes
- **Groceries**: Shopping list management
- **Profile**: User profile and settings

### Recipe Screens
- **Recipe List**: Browse your recipes
- **Recipe Detail**: View full recipe with instructions
- **Create Recipe**: Build new recipes
- **Cook Step**: Step-by-step cooking guide

### AI Features
- **Generate from Ingredients**: AI recipe generation
- **Recipe Results**: View generated recipe options
- **Recipe Import**: Import from URL, text, or image

## 🔐 Authentication

The app uses Supabase Authentication with:
- Email/Password authentication
- Secure session management
- User profile management

## 💾 Data Storage

- **Supabase PostgreSQL**: Cloud database for recipes, users, and social data
- **AsyncStorage**: Local storage for offline access and caching
- **Supabase Storage**: Image storage for recipe photos

## 🎨 Design System

The app uses a consistent design system with:
- Primary color: `#DA6809` (Orange)
- Typography: Custom font weights optimized for Android
- Components: Reusable styled components
- Platform-specific styling for iOS and Android

## 🔄 Real-time Sync

Recipes are automatically synced with Supabase using:
- Real-time subscriptions for live updates
- Optimistic UI updates
- Conflict resolution
- Offline queue management

## 📊 Performance Optimizations

- Image compression and optimization
- Lazy loading for recipe lists
- Caching strategies
- Efficient re-renders with React.memo
- Optimized image components

## 🐛 Troubleshooting

### Common Issues

**Metro bundler errors:**
```bash
npm start -- --reset-cache
```

**iOS build issues:**
```bash
cd ios && pod install && cd ..
```

**Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
```

**Backend connection issues:**
- Ensure the backend server is running on port 3001
- Check environment variables
- Verify network connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Code Style

- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful commit messages

## 📄 License

This project is private and proprietary.

## 👥 Team

Developed with ❤️ by the Chef iQ team

## 📞 Support

For support, please open an issue in the repository or contact the development team.

## 🗺️ Roadmap

- [ ] Enhanced AI recipe customization
- [ ] Social feed and following system
- [ ] Recipe video uploads
- [ ] Meal planning features
- [ ] Nutrition tracking
- [ ] Multi-language support

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- Supabase for backend infrastructure
- OpenAI for AI capabilities
- React Native community for excellent libraries

---

**Made with ❤️ for food lovers everywhere**

