# Chef iQ RN - Changelog

## [Latest] - 2024-10-28

### ✨ New Features
- **Comment System**: Added comprehensive comment functionality with like system
- **Step-by-Step Cooking**: Implemented dedicated CookStepScreen for guided cooking
- **User Registration**: Added complete user registration flow
- **Serving Size Adjustment**: Real-time ingredient scaling based on serving size
- **Swipe Navigation**: Implemented swipe gestures for cooking step navigation

### 🎨 UI/UX Improvements
- **Keyboard Handling**: Optimized keyboard avoidance for all input fields
- **Dropdown Positioning**: Fixed dropdown menu positioning and z-index issues
- **Recipe Tags**: Improved input field with proper keyboard avoidance
- **Card Layout**: Cleaned up favorite recipe card design
- **Navigation**: Enhanced bottom navigation for cooking steps

### 🔧 Technical Improvements
- **Context Management**: Added CommentContext for comment state management
- **Gesture Handling**: Implemented PanResponder for swipe navigation
- **Keyboard Optimization**: Improved KeyboardAvoidingView behavior
- **Data Validation**: Fixed serving size calculation edge cases
- **Layer Management**: Improved dropdown menu layering and visibility

### 📱 Screen Updates
- **RecipeDetailScreen**: Enhanced with comment system and improved keyboard handling
- **CreateRecipeScreen**: Improved dropdown positioning and serving size features
- **FavoriteRecipeScreen**: Cleaned up card layout and removed redundant icons
- **CookStepScreen**: New dedicated screen for step-by-step cooking guidance
- **RegisterScreen**: New user registration screen with validation

### 🐛 Bug Fixes
- Fixed object rendering errors in step descriptions
- Resolved dropdown menu overlap issues with subsequent cards
- Fixed serving size calculation NaN issues
- Improved keyboard avoidance behavior across all screens
- Fixed z-index conflicts in dropdown menus

### 📊 Statistics
- **Files Changed**: 12 files
- **Lines Added**: 1,931 insertions
- **Lines Removed**: 95 deletions
- **New Files**: 3 (CommentContext, CookStepScreen, RegisterScreen)

## Previous Versions
- [v1.0.0] - Initial project setup and basic functionality
- [v1.1.0] - Added comprehensive project documentation
