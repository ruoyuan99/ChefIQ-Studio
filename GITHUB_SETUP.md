# GitHub Repository Setup Guide

## Option 1: Create a New GitHub Repository (Recommended)

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `chef-iq-recipe-app` (or your preferred name)
   - Description: "Chef iQ Recipe App - React Native app with AI recipe generation"
   - Choose **Private** or **Public** (recommend Private for proprietary code)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

2. **Add remote and push:**
   ```bash
   cd "/Users/ruoyuangao/Desktop/Chef iQ RN"
   git remote add origin https://github.com/YOUR_USERNAME/chef-iq-recipe-app.git
   git branch -M main
   git push -u origin main
   ```

## Option 2: Use Existing GitHub Repository

If you already have a GitHub repository:

1. **Add the remote:**
   ```bash
   cd "/Users/ruoyuangao/Desktop/Chef iQ RN"
   git remote add origin https://github.com/YOUR_USERNAME/REPOSITORY_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Authentication

If you encounter authentication issues:

### Using HTTPS (recommended for beginners):
- GitHub will prompt for username and password
- For password, use a Personal Access Token (not your GitHub password)
- Create token: GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
- Required scopes: `repo` (full control of private repositories)

### Using SSH (recommended for security):
1. **Generate SSH key (if you don't have one):**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Add SSH key to GitHub:**
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub Settings → SSH and GPG keys → New SSH key
   - Paste your public key and save

3. **Update remote URL to use SSH:**
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/REPOSITORY_NAME.git
   git push -u origin main
   ```

## Verify Push

After pushing, verify on GitHub:
```bash
git remote -v
git log --oneline -5
```

## Future Updates

To push future changes:
```bash
git add .
git commit -m "Your commit message"
git push
```

## Troubleshooting

### If you get "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/REPOSITORY_NAME.git
```

### If you get authentication errors:
- Make sure you're using a Personal Access Token (not password)
- Check that your token has the correct permissions
- Try using SSH instead of HTTPS

### If you need to force push (use with caution):
```bash
git push -u origin main --force
```

## Important Notes

⚠️ **Before pushing, make sure:**
- All sensitive data (API keys, passwords) are in `.env` files (already in `.gitignore`)
- No hardcoded secrets in the code
- `.env` files are NOT committed (they're in `.gitignore`)

✅ **Safe to push:**
- All code files
- Configuration files (without secrets)
- README and documentation
- Package files

