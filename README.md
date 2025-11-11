# Chef iQ Recipe App

A React Native recipe management app with AI-powered recipe generation, social features, and Chef iQ Challenge integration.

## Features

- 🍳 **Recipe Management**: Create, edit, and organize your recipes
- 🤖 **AI Recipe Generation**: Generate recipes from ingredients using OpenAI
- 📹 **YouTube Integration**: Find cooking videos related to your recipes
- 🏆 **Chef iQ Challenge**: Participate in cooking challenges with the iQ MiniOven
- 👥 **Social Features**: Like, favorite, comment, and share recipes
- 📱 **Cross-platform**: iOS and Android support with Expo
- 🔄 **Real-time Sync**: Sync recipes with Supabase backend

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini / GPT-4o
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage, AsyncStorage

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account
- OpenAI API key
- YouTube Data API key (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Chef iQ RN"
```

2. Install dependencies:
```bash
cd MenuApp
npm install

cd ../server
npm install
```

3. Set up environment variables:

Create `.env` files in both `MenuApp` and `server` directories:

**MenuApp/.env**:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**server/.env**:
```
OPENAI_API_KEY=your_openai_api_key
YOUTUBE_API_KEY=your_youtube_api_key
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

4. Start the development server:
```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start Expo app
cd MenuApp
npm start
```

## Project Structure

```
Chef iQ RN/
├── MenuApp/                 # React Native app
│   ├── src/
│   │   ├── screens/         # Screen components
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── navigation/      # Navigation setup
│   │   └── types/           # TypeScript types
│   └── package.json
├── server/                  # Backend server
│   ├── server.js           # Express server
│   └── package.json
└── README.md
```

## Key Features

### Chef iQ Challenge
- Participate in cooking challenges
- Submit recipes made with Chef iQ MiniOven
- Compete for prizes and recognition
- Automatic tagging and cookware locking

### AI Recipe Generation
- Generate recipes from ingredients
- Multiple recipe options
- YouTube video recommendations
- Dietary restrictions and cuisine preferences

### Recipe Management
- Create and edit recipes
- Import recipes from URLs
- Draft and publish workflow
- Image uploads
- Ingredient and instruction management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For support, email support@chefiq.com

