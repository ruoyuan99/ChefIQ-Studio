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

## Environment Variables Configuration

### Quick Setup

**Method 1: Use Setup Script (Recommended)**
```bash
# MenuApp directory
cd MenuApp
./setup-env.sh

# Server directory
cd ../server
./setup-env.sh
```

**Method 2: Manual Setup**
```bash
# Copy example files
cd MenuApp
cp env.example .env

cd ../server
cp env.example .env
```

### Environment Variables Description

#### MenuApp/.env (Required)

| Variable Name | Description | How to Obtain |
|--------|------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Project URL | Supabase Project Settings > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Supabase Project Settings > API |

#### server/.env (Required)

| Variable Name | Description | How to Obtain |
|--------|------|----------|
| `OPENAI_API_KEY` | OpenAI API Key | https://platform.openai.com/api-keys |
| `YOUTUBE_API_KEY` | YouTube Data API Key | Google Cloud Console > Credentials |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Project URL | Supabase Project Settings > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Supabase Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (⚠️ Server-side only, keep secret!) | Supabase Project Settings > API > service_role key |

### Detailed Steps to Obtain API Keys

#### 1. Supabase
1. Visit https://app.supabase.com
2. Create a new project or select an existing project
3. Go to **Project Settings > API**
4. Copy the following information:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Server-side only, keep secret!)

#### 2. OpenAI
1. Visit https://platform.openai.com
2. Register/login to your account
3. Go to **API Keys**: https://platform.openai.com/api-keys
4. Click **Create new secret key**
5. Copy the key → `OPENAI_API_KEY`

#### 3. YouTube Data API
1. Visit Google Cloud Console: https://console.cloud.google.com
2. Create a new project or select an existing project
3. Enable **YouTube Data API v3**:
   - Go to **APIs & Services > Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**
4. Create API Key:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > API Key**
   - Copy the key → `YOUTUBE_API_KEY`

### Security Notes

1. **Never commit `.env` files to Git**
   - `.env` files are already in `.gitignore`
   - Only commit `env.example` files

2. **Protect Service Role Key**
   - `SUPABASE_SERVICE_ROLE_KEY` has administrator privileges
   - Only use on server-side
   - Do not expose in client-side code

3. **API Key Management**
   - Use environment variables, don't hardcode
   - Rotate API keys regularly
   - Use different keys for development and production environments

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

**Option A: Use the setup script (Recommended)**
```bash
# Setup MenuApp environment
cd MenuApp
./setup-env.sh

# Setup server environment
cd ../server
./setup-env.sh
```

**Option B: Manual setup**
```bash
# Copy example files
cd MenuApp
cp env.example .env

cd ../server
cp env.example .env
```

Then edit the `.env` files with your actual credentials:

**MenuApp/.env** (Required):
```env
# Supabase Configuration (Required)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend URL (Optional - has defaults)
# For local development, uncomment and set your local IP:
# EXPO_PUBLIC_BACKEND_URL_DEV=http://192.168.10.153:3001
```

**server/.env** (Required):
```env
# Server Configuration
PORT=3001

# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# YouTube Data API Key (Required for YouTube features)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Supabase Configuration (Required for YouTube cache)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

4. Set up the database (if using Supabase):

   Run the database migration scripts in the `MenuApp/database/` directory:
   ```bash
   # In Supabase SQL Editor, run these files in order:
   # 1. schema.sql (or step1_tables.sql, step2_indexes.sql, step3_security.sql)
   # 2. recipe_surveys_table.sql (if using survey feature)
   ```
   
   **Database Table Structure:**
   - `users` - User table
   - `recipes` - Recipe table
   - `ingredients` - Ingredient table
   - `instructions` - Instruction table
   - `tags` - Tag table
   - `favorites` - Favorite table
   - `comments` - Comment table
   - `recipe_surveys` - Recipe survey table (optional feature)

5. Start the development server:
```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start Expo app
cd MenuApp
npm start
```

## Local Development Guide

### Complete Running Steps

#### 1. Start Backend Server

```bash
cd server
npm start
```

The backend server will start at `http://localhost:3001`. Make sure you see the following message:
```
✅ Server is running on port 3001
```

#### 2. Start Expo App

In a new terminal window:

```bash
cd MenuApp
npm start
```

This will start the Expo development server, and you'll see:
- QR code (for scanning on your phone)
- Development menu options

#### 3. Run Application

**Run on iOS Simulator:**
```bash
# After Expo dev server starts, press 'i' key
# Or
npm run ios
```

**Run on Android Emulator:**
```bash
# After Expo dev server starts, press 'a' key
# Or
npm run android
```

**Run on Real Device:**
1. Install Expo Go app (iOS App Store or Google Play)
2. Make sure your phone and computer are on the same Wi-Fi network
3. Scan the QR code shown in the terminal
4. Or use the "Enter URL manually" option in the Expo development menu

### Configure Local Network (Real Device)

If using a real device, you need to configure the backend URL:

1. **Find your local IP address:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
   Find an IP address similar to `192.168.x.x`

2. **Update MenuApp/.env:**
   ```env
   EXPO_PUBLIC_BACKEND_URL_DEV=http://192.168.x.x:3001
   ```

3. **Restart Expo development server:**
   ```bash
   # Press Ctrl+C to stop, then restart
   npm start
   ```

### localhost Addresses for Different Platforms

| Platform | Backend URL |
|------|----------|
| iOS Simulator | `http://localhost:3001` |
| Android Emulator | `http://10.0.2.2:3001` |
| Real Device | `http://YOUR_LOCAL_IP:3001` |

### Development Tools

#### Expo Development Menu

In the app, you can:
- **Shake device** (iOS) or **press menu key** (Android) to open the development menu
- Or press `Cmd+D` (iOS) or `Cmd+M` (Android) in the simulator

Development menu options:
- **Reload** - Reload the app
- **Debug Remote JS** - Enable remote debugging
- **Show Element Inspector** - Display element inspector
- **Enable Fast Refresh** - Enable fast refresh

#### Hot Reload

The app supports Hot Reload:
- After modifying code, the app will automatically reload
- If you modified native code or configuration files, you need to fully restart

#### Clear Cache

If you encounter problems, you can clear the cache:
```bash
# Clear Expo cache
expo start -c

# Or
npm start -- --clear
```

### Common Troubleshooting

#### 1. Backend Connection Failed

**Symptoms:** App cannot connect to backend server

**Solutions:**
- Make sure backend server is running (`cd server && npm start`)
- Check if the port is correct (default 3001)
- Check firewall settings
- Make sure device and server are on the same network
- Check `EXPO_PUBLIC_BACKEND_URL_DEV` configuration in `MenuApp/.env`

#### 2. Environment Variables Not Taking Effect

**Symptoms:** After modifying `.env` file, app still uses old values

**Solutions:**
- Restart Expo development server (`Ctrl+C` then `npm start`)
- Make sure variable names start with `EXPO_PUBLIC_`
- Clear cache: `expo start -c`

#### 3. Supabase Connection Failed

**Symptoms:** Cannot connect to Supabase database

**Solutions:**
- Check Supabase configuration in `MenuApp/.env`
- Verify that Supabase project is running normally
- Check network connection
- View error messages in browser console or terminal

#### 4. Module Not Found Error

**Symptoms:** `Module not found` or `Cannot find module`

**Solutions:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# If problem persists, clear all caches
rm -rf node_modules package-lock.json
npm install
```

#### 5. iOS Build Error

**Symptoms:** iOS simulator or device cannot start app

**Solutions:**
```bash
# Clean iOS build cache
cd ios
pod deintegrate
pod install
cd ..

# Restart
npm run ios
```

#### 6. Android Build Error

**Symptoms:** Android emulator or device cannot start app

**Solutions:**
```bash
# Clean Android build cache
cd android
./gradlew clean
cd ..

# Restart
npm run android
```

### Debugging Tips

#### 1. View Logs

**Terminal Logs:**
- Backend server logs are displayed in the `server` terminal
- Expo logs are displayed in the `MenuApp` terminal

**In-App Logs:**
- In development mode, `console.log` will display in the terminal
- Use React Native Debugger to view more detailed logs

#### 2. Network Request Debugging

**View Backend Requests:**
- Backend server terminal will display all API requests
- Check request paths, parameters, and responses

**View Frontend Requests:**
- Open `http://localhost:19002` in browser (Expo DevTools)
- Use React Native Debugger's network panel

#### 3. Database Debugging

**Supabase Dashboard:**
- Visit https://app.supabase.com
- Go to project > Table Editor to view data
- Use SQL Editor to run queries

### Performance Optimization Suggestions

1. **Test with production mode:**
   ```bash
   npm start -- --no-dev --minify
   ```

2. **Monitor network requests:**
   - Use React Native Debugger's network panel
   - Check for duplicate requests

3. **Optimize image loading:**
   - Use `OptimizedImage` component
   - Enable image caching

### Quick Setup Checklist

- [ ] Installed Node.js and npm
- [ ] Cloned the repository
- [ ] Installed dependencies (`npm install` in both `MenuApp` and `server`)
- [ ] Created `.env` files from `env.example` in both directories
- [ ] Added Supabase credentials to both `.env` files
- [ ] Added OpenAI API key to `server/.env`
- [ ] Added YouTube API key to `server/.env`
- [ ] Set up Supabase database (run migration scripts)
- [ ] Started backend server (`cd server && npm start`)
- [ ] Started Expo app (`cd MenuApp && npm start`)

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
│   ├── database/            # Database migration scripts
│   │   ├── schema.sql       # Main database schema
│   │   ├── recipe_surveys_table.sql  # Survey feature table
│   │   └── ...              # Other migration scripts
│   ├── server/              # Backend server
│   │   ├── server.js        # Express server
│   │   └── package.json
│   ├── env.example          # Environment variables template
│   ├── setup-env.sh         # Environment setup script
│   └── package.json
└── README.md
```

## Core Feature Implementation

### Image Management
- **Automatic Upload**: Images imported from websites are automatically downloaded and uploaded to Supabase Storage
- **Unified Storage**: All images are stored in Supabase Storage, ensuring persistence and reliability
- **Image Compression**: Automatically compress images to optimize performance and storage space
- **Smart Processing**: Supports both local images and remote URLs, automatically identifies and processes them

### Data Synchronization
- **Real-time Sync**: Uses Supabase real-time features to sync recipe data
- **Offline Support**: Uses AsyncStorage to cache data, supports offline access
- **Auto Cleanup**: Automatically cleans local cache after successful sync, ensuring data consistency
- **UUID Management**: Uses UUID as primary key, ensuring global uniqueness

### Recipe Source Unification
- **Single Data Source**: Sample recipes use hardcoded arrays, avoiding duplication
- **Smart Deduplication**: Automatically filters duplicate recipes, prioritizes user-created versions
- **ID Management**: Uses UUID to ensure uniqueness, avoids conflicts with sample recipe IDs

## Key Features

### Chef iQ Challenge
- Participate in cooking challenges
- Submit recipes made with Chef iQ MiniOven
- Compete for prizes and recognition
- Automatic tagging and cookware locking

### AI Recipe Generation
- Generate recipes from ingredients using OpenAI GPT-4o-mini / GPT-4o
- Multiple recipe options
- YouTube video recommendations
- Dietary restrictions and cuisine preferences

### Recipe Management
- Create and edit recipes
- Import recipes from URLs (with automatic image download and upload to Supabase Storage)
- Draft and publish workflow
- Image uploads (local images and remote URLs are automatically uploaded to Supabase Storage)
- Ingredient and instruction management
- Real-time sync with Supabase backend

### Recipe Survey Feature
- Users can provide feedback after trying a recipe
- Three survey questions:
  1. **Taste preference** (Like / Neutral / Dislike)
  2. **Difficulty level** (Easy / Medium / Hard)
  3. **Would make again?** (Yes / No)
- Community feedback statistics displayed on recipe detail page
- Data stored in `recipe_surveys` table (requires database migration: `recipe_surveys_table.sql`)

### Social Features
- Like, favorite, and comment on recipes
- Share recipes with share codes
- View community statistics (likes, favorites, views, tried count)
- Points system for user engagement

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For support, email support@chefiq.com

