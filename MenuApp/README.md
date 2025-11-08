# Chef iQ RN - Recipe Management App

A modern React Native recipe management application built with Expo, TypeScript, and Context API.

## 🚀 Features

- **Recipe Management**: Create, edit, and manage your recipes
- **Smart Navigation**: Intuitive bottom tab navigation with custom components
- **Social Features**: Like, favorite, and share recipes
- **Grocery Lists**: Generate shopping lists from recipes
- **Modern UI**: Clean, responsive design with Material Design principles
- **TypeScript**: Full type safety and better development experience
- **Context API**: Efficient state management with React Context

## 📱 Screens

- **Home**: Dashboard with quick actions and recent recipes
- **Explore**: Discover new recipes and browse categories
- **Groceries**: Manage your shopping lists
- **Profile**: User settings and statistics
- **Recipe Detail**: Detailed recipe view with ingredients and instructions
- **Create Recipe**: Comprehensive recipe creation interface

## 🛠️ Tech Stack

- **React Native 0.81.5** - Cross-platform mobile framework
- **Expo SDK 54** - Development tools and runtime
- **TypeScript 5.9.2** - Type-safe JavaScript
- **React Navigation 7.x** - Declarative navigation
- **Context API** - State management
- **AsyncStorage** - Local data persistence

## 🏗️ Architecture

```
📱 App Layer (App.tsx)
├── 🧭 Navigation Layer (AppNavigator.tsx)
├── 🎯 Screen Layer (screens/)
├── 🧩 Component Layer (components/)
├── 🔄 Context Layer (contexts/)
├── 📊 Data Layer (data/)
└── 🎨 Types Layer (types/)
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd MenuApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
npm run ios     # iOS
npm run android # Android
npm run web     # Web
```

## 📁 Project Structure

```
MenuApp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── data/              # Sample data and schemas
│   ├── navigation/         # Navigation configuration
│   ├── screens/           # Screen components
│   └── types/              # TypeScript type definitions
├── assets/                 # Images and static assets
├── App.tsx                 # Main app component
└── package.json           # Dependencies and scripts
```

## 🎨 Key Features

### Recipe Management
- Create recipes with ingredients and instructions
- Add images and metadata
- Categorize and tag recipes
- Public/private recipe sharing

### Social Features
- Like and favorite recipes
- Social statistics tracking
- Points and achievement system
- Recipe sharing capabilities

### Smart UI
- Custom bottom tab navigator
- Full-screen recipe detail view
- Responsive design for all screen sizes
- Modern Material Design components

## 🔧 Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser

### State Management

The app uses React Context API for state management:

- **RecipeContext**: Recipe CRUD operations
- **FavoriteContext**: Favorite recipes management
- **GroceriesContext**: Shopping list management
- **LikeContext**: Recipe likes and social features
- **PointsContext**: User points and achievements
- **SocialStatsContext**: Social statistics tracking

## 📱 Platform Support

- **iOS**: Full support with native features
- **Android**: Full support with Material Design
- **Web**: Progressive Web App support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Ruoyuan Gao
- **Project**: Chef iQ RN Recipe Management App

## 📞 Support

For support, email support@chefiq.com or create an issue in this repository.

---

Made with ❤️ using React Native and Expo