# Backend Configuration Guide

## ✅ Backend Successfully Deployed

Your backend is now running on Railway:
- **URL**: `https://chefiq-studio-production.up.railway.app`
- **Status**: ✅ Active and responding

## 📱 Frontend Configuration

The frontend has been configured to connect to the Railway backend in two ways:

### 1. **Default Production URL** (recipeImport.ts)
- Updated `PROD_BACKEND_URL` to use the Railway URL
- This is used when no environment variables are set

### 2. **EAS Build Environment Variables** (eas.json)
- Added `EXPO_PUBLIC_BACKEND_URL` to both `preview` and `production` build profiles
- This ensures the correct backend URL is used in built apps

## 🔄 How It Works

The app uses the following priority order to determine the backend URL:

1. **Environment Variable** (`EXPO_PUBLIC_BACKEND_URL`) - Highest priority
2. **Environment-Specific Variables** (`EXPO_PUBLIC_BACKEND_URL_DEV` / `EXPO_PUBLIC_BACKEND_URL_PROD`)
3. **Default Values**:
   - Development: Local network IP (`http://192.168.10.153:3001`)
   - Production: Railway URL (`https://chefiq-studio-production.up.railway.app`)

## 🧪 Testing

To test the backend connection:

```bash
# Health check
curl https://chefiq-studio-production.up.railway.app/health

# Expected response:
# {"status":"ok","service":"Recipe Import Server",...}
```

## 📝 Local Development

For local development, the app will still use your local backend (`http://192.168.10.153:3001`) when running in development mode (`__DEV__ === true`).

To override and use Railway backend during development, set:
```bash
export EXPO_PUBLIC_BACKEND_URL=https://chefiq-studio-production.up.railway.app
```

## 🚀 Production Builds

When building with EAS:
- **Preview builds**: Will use Railway backend (via `EXPO_PUBLIC_BACKEND_URL` in `eas.json`)
- **Production builds**: Will use Railway backend (via `EXPO_PUBLIC_BACKEND_URL` in `eas.json`)

## 🔐 API Keys

All API keys (OpenAI, YouTube) are configured in Railway's environment variables. No changes needed in the frontend.

## ✅ Next Steps

1. **Test the app**: Run the app and verify it can connect to the Railway backend
2. **Build for production**: Use `eas build --platform android --profile production` to create a production build
3. **Monitor Railway**: Check Railway dashboard for logs and metrics

## 📚 Related Files

- `MenuApp/src/config/recipeImport.ts` - Backend URL configuration
- `MenuApp/eas.json` - EAS build environment variables
- `MenuApp/server/RAILWAY_SUCCESS.md` - Railway deployment guide

