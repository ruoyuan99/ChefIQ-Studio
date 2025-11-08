# Chef iQ Studio

A React Native mobile application for recipe management, sharing, and discovery.

## Features

### Core Features
- 📱 Recipe creation and management
- 🔍 Recipe exploration and search
- ❤️ Favorite recipes
- 📝 Recipe comments and social interactions
- 👤 User profiles with avatar and bio
- 🏆 Points system for user engagement
- 📤 Recipe sharing

### AI-Powered Features
- 🌐 Import recipes from websites
- 📷 Scan recipes from images
- 📝 Import recipes from text
- ✨ AI recipe optimization
- 📊 Token usage logging and cost tracking

### Technical Features
- 🔐 Supabase authentication and database
- 📸 Image upload to Supabase Storage
- 🔄 Real-time data synchronization
- 💾 Local caching with AsyncStorage
- 🎨 Modern UI with React Native

## Setup

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Supabase account
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd "Chef iQ RN"
```

2. Install dependencies:
```bash
cd MenuApp
npm install
```

3. Set up environment variables:
```bash
# In MenuApp directory
# Create .env file with your Supabase credentials
```

4. Set up backend server (for AI features):
```bash
cd server
npm install
# Create .env file with OPENAI_API_KEY
```

5. Start the development server:
```bash
cd MenuApp
npm start
```

## Project Structure

```
Chef iQ RN/
├── MenuApp/              # React Native app
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── screens/      # App screens
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── assets/           # Images and assets
├── server/               # Backend server for AI features
│   ├── server.js         # Express server
│   └── aiTokenLogger.js  # Token usage logging
└── database/             # Database migration scripts
```

## Documentation

- [AI Features Analysis](AI_FEATURES_ANALYSIS.md)
- [AI Implementation Roadmap](AI_IMPLEMENTATION_ROADMAP.md)
- [AI Token Logging](server/AI_TOKEN_LOGGING.md)
- [Testing Guide](TESTING_GUIDE.md)
- [iOS Deployment Guide](IOS_DEPLOYMENT_GUIDE.md)

## Contributing

1. Create a feature branch
2. Make your changes
3. Commit with descriptive messages
4. Push to your branch
5. Create a pull request

## License

[Your License Here]

