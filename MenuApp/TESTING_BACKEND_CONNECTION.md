# Testing Backend Connection

## ✅ Configuration Complete

Your app is now configured to connect to the Railway backend:
- **Backend URL**: `https://chefiq-studio-production.up.railway.app`
- **Status**: ✅ Active

## 🧪 Testing Steps

### 1. **Test Backend Health** (Already Verified ✅)
```bash
curl https://chefiq-studio-production.up.railway.app/health
```

Expected response:
```json
{"status":"ok","service":"Recipe Import Server",...}
```

### 2. **Test in Development Mode**

#### Option A: Use Local Backend (Default)
- The app will automatically use your local backend (`http://192.168.10.153:3001`) when running in development mode
- Start your local server: `cd MenuApp/server && npm start`
- Run the app: `cd MenuApp && npm start`

#### Option B: Use Railway Backend in Development
Set environment variable before starting:
```bash
export EXPO_PUBLIC_BACKEND_URL=https://chefiq-studio-production.up.railway.app
cd MenuApp && npm start
```

### 3. **Test Production Build**

Build a preview APK to test with Railway backend:
```bash
cd MenuApp
eas build --platform android --profile preview
```

The preview build will automatically use the Railway backend URL configured in `eas.json`.

### 4. **Test Key Features**

Once the app is running, test these features that use the backend:

1. **Generate Recipe from Ingredients**
   - Navigate to: Favorite Recipe Screen → "Generate from Ingredients"
   - Select ingredients and cooking time
   - Click "Generate Recipe"
   - ✅ Should connect to Railway backend and generate recipes

2. **Import Recipe from URL**
   - Navigate to: Home → "Create New Recipe" → "Import from Website"
   - Enter a recipe URL
   - ✅ Should connect to Railway backend and import recipe

3. **Scan Recipe from Image**
   - Navigate to: Home → "Create New Recipe" → "Scan Recipe"
   - Take/select a photo
   - ✅ Should connect to Railway backend and scan recipe

## 🔍 Troubleshooting

### Issue: App can't connect to backend

**Check 1: Verify backend is running**
```bash
curl https://chefiq-studio-production.up.railway.app/health
```

**Check 2: Check app logs**
- Look for network errors in Metro bundler console
- Check for "Failed to fetch" or "Network request failed" errors

**Check 3: Verify environment**
- Development: Should use local backend by default
- Production build: Should use Railway backend automatically

**Check 4: Network connectivity**
- Ensure device/simulator has internet connection
- Check if Railway URL is accessible from your network

### Issue: Backend returns errors

**Check Railway logs:**
1. Go to Railway dashboard
2. Navigate to your project → "Deployments"
3. Click on latest deployment → "Deploy Logs"
4. Look for error messages

**Common issues:**
- Missing API keys: Check Railway environment variables
- Node.js version: Should be 20 (already configured)
- Port configuration: Should use `process.env.PORT` (already configured)

## 📊 Monitoring

### Railway Dashboard
- **URL**: https://railway.app
- **Metrics**: Check CPU, Memory, Network usage
- **Logs**: Real-time deployment and runtime logs

### Backend Endpoints
- Health: `GET /health`
- Generate Recipe: `POST /api/generate-recipe-from-ingredients`
- Import Recipe: `POST /api/import-recipe`
- Optimize Recipe: `POST /api/optimize-recipe`
- Scan Recipe: `POST /api/scan-recipe`

## ✅ Next Steps

1. **Test locally** with Railway backend (optional)
2. **Build preview APK** to test production configuration
3. **Monitor Railway** for any issues
4. **Test all features** that require backend connectivity

## 📝 Notes

- **Development**: Uses local backend by default for faster iteration
- **Production**: Automatically uses Railway backend via EAS build config
- **Environment Variables**: Can override default behavior if needed

