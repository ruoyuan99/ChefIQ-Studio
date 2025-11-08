# AI-Enhanced Recipe Import Setup

## Overview

The recipe import server now supports AI-enhanced parsing using OpenAI's GPT models. This allows the server to extract recipe information from **any website**, even if it doesn't use Schema.org structured data.

## How It Works

1. **Primary Method**: The server first tries to extract recipe data using Schema.org structured data (fast and free)
2. **AI Optimization**: If OpenAI API is configured, the server **always** uses AI to optimize and improve the extracted recipe data, making it more accurate, standardized, and well-formatted
3. **AI Fallback**: If Schema.org extraction fails, the server uses AI to intelligently parse the webpage content and extract recipe information from scratch

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy your API key

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. (Optional) Specify which model to use:
   ```
   OPENAI_MODEL=gpt-4o-mini
   ```
   
   Model options:
   - `gpt-4o-mini` (recommended, cheapest, default)
   - `gpt-4o` (more accurate, more expensive)
   - `gpt-4-turbo` (best accuracy, most expensive)
   - `gpt-3.5-turbo` (cheapest, less accurate)

### 3. Install Dependencies

```bash
npm install
```

### 4. Restart the Server

```bash
npm start
```

## Cost Considerations

- **Schema.org parsing**: Free (used first)
- **AI optimization**: Always runs when API key is configured (optimizes all recipes)
  - `gpt-4o-mini`: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
  - Typical recipe optimization: ~$0.001-0.005 per recipe
- **AI extraction**: Only used when Schema.org fails
  - Typical recipe extraction: ~$0.001-0.01 per recipe
- **Total cost per recipe**: ~$0.001-0.015 (with optimization enabled)
- Set usage limits in your OpenAI account dashboard

## Testing

1. Test with a Schema.org website (free):
   ```bash
   curl -X POST http://localhost:3001/api/import-recipe \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.recipetineats.com/chicken-chasseur/"}'
   ```

2. Test with a non-Schema.org website (uses AI):
   ```bash
   curl -X POST http://localhost:3001/api/import-recipe \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example-recipe-site.com/recipe"}'
   ```

## Features

✅ **AI Optimization** (always enabled when API key is set):
   - Standardizes ingredient amounts and units
   - Improves instruction clarity and removes redundancy
   - Normalizes cooking time and serving formats
   - Adds relevant tags when missing
   - Ensures data consistency and quality

✅ **AI Extraction** (fallback when Schema.org fails):
   - Extracts recipe title, description, ingredients, and instructions  
   - Works with any website format  
   - Handles various ingredient formats (fractions, measurements, etc.)  
   - Extracts cooking time and servings when available  
   - Extracts tags/categories when available

✅ Falls back gracefully if AI is unavailable (uses original extraction)  

## Troubleshooting

### "OpenAI API is not configured"
- Make sure you've created a `.env` file with `OPENAI_API_KEY`
- Restart the server after adding the key

### "AI extraction failed"
- Check your API key is valid
- Check your OpenAI account has credits
- Try a different model (some models may not support JSON mode)

### High costs
- Use `gpt-4o-mini` instead of `gpt-4o` or `gpt-4-turbo`
- Set usage limits in OpenAI dashboard
- Consider caching successful extractions

## Security Notes

- Never commit `.env` file to git (it's already in `.gitignore`)
- Keep your API key secret
- Consider using environment variables in production instead of `.env` file

