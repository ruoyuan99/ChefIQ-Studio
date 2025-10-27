# Chef iQ - 智能菜单管理应用

一个基于React Native + Expo的移动端菜单创建和分享应用。

## 功能特性

### 🍽️ 菜单管理
- **创建菜单**: 轻松创建和管理多个菜单
- **菜品管理**: 添加、编辑、删除菜品信息
- **分类管理**: 支持菜品分类（开胃菜、主菜、甜点、饮品等）
- **价格管理**: 设置菜品价格
- **可用性控制**: 控制菜品的可用状态

### 📱 现代化界面
- **响应式设计**: 适配不同屏幕尺寸
- **直观操作**: 简洁易用的用户界面
- **实时预览**: 实时查看菜单效果
- **状态指示**: 清晰的状态显示

### 🔗 分享功能
- **系统分享**: 通过系统分享功能发送菜单
- **分享码**: 生成唯一分享码供他人访问
- **文本复制**: 复制菜单内容到剪贴板
- **公开/私有**: 控制菜单的可见性

## 技术栈

- **React Native**: 跨平台移动应用开发
- **Expo**: 开发工具链和运行时
- **TypeScript**: 类型安全的JavaScript
- **React Navigation**: 导航管理
- **Context API**: 状态管理
- **Expo Vector Icons**: 图标库

## 项目结构

```
src/
├── components/          # 可复用组件
├── contexts/           # React Context (状态管理)
│   └── MenuContext.tsx
├── navigation/         # 导航配置
│   └── AppNavigator.tsx
├── screens/           # 页面组件
│   ├── HomeScreen.tsx
│   ├── MenuListScreen.tsx
│   ├── CreateMenuScreen.tsx
│   ├── MenuDetailScreen.tsx
│   └── ShareMenuScreen.tsx
├── types/             # TypeScript 类型定义
│   └── index.ts
└── utils/             # 工具函数
```

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn
- Expo CLI
- iOS Simulator 或 Android Emulator (可选)
- 物理设备 + Expo Go 应用

### 安装依赖
```bash
cd MenuApp
npm install
```

### 启动开发服务器
```bash
npm start
```

### 在设备上运行
1. 在手机上安装 Expo Go 应用
2. 扫描终端中显示的二维码
3. 应用将在你的设备上运行

### 在模拟器上运行
```bash
# iOS 模拟器
npm run ios

# Android 模拟器
npm run android
```

## 使用指南

### 创建菜单
1. 点击首页的"创建新菜单"按钮
2. 填写菜单标题和描述
3. 设置菜单为公开或私有
4. 添加菜品信息（名称、描述、价格、分类）
5. 点击保存

### 管理菜品
- 在菜单详情页面可以编辑菜品
- 控制菜品的可用状态
- 按分类筛选菜品
- 删除不需要的菜品

### 分享菜单
1. 在菜单详情页面点击分享按钮
2. 选择分享方式：
   - 系统分享：通过其他应用分享
   - 复制文本：复制到剪贴板
   - 生成分享码：创建唯一分享码

## 主要功能

### 菜单管理
- ✅ 创建、编辑、删除菜单
- ✅ 菜品管理（增删改查）
- ✅ 分类管理
- ✅ 价格设置
- ✅ 可用性控制

### 分享功能
- ✅ 系统分享
- ✅ 分享码生成
- ✅ 文本复制
- ✅ 公开/私有控制

### 用户体验
- ✅ 现代化UI设计
- ✅ 响应式布局
- ✅ 直观的操作流程
- ✅ 实时状态更新

## 开发说明

### 状态管理
应用使用React Context进行状态管理，主要状态包括：
- 菜单列表
- 当前菜单
- 加载状态

### 导航结构
- Home: 主页面
- MenuList: 菜单列表
- CreateMenu: 创建/编辑菜单
- MenuDetail: 菜单详情
- ShareMenu: 分享菜单

### 类型定义
所有TypeScript类型定义在 `src/types/index.ts` 中，包括：
- MenuItem: 菜品信息
- Menu: 菜单信息
- RootStackParamList: 导航参数类型

## 扩展功能

### 计划中的功能
- [ ] 图片上传支持
- [ ] 二维码分享
- [ ] 菜单模板
- [ ] 数据导出
- [ ] 云端同步

### 自定义开发
- 添加新的菜品分类
- 自定义分享格式
- 集成第三方服务
- 添加用户认证

## 故障排除

### 常见问题
1. **依赖安装失败**: 尝试清除缓存 `npm cache clean --force`
2. **Expo Go连接失败**: 确保设备和电脑在同一网络
3. **TypeScript错误**: 检查类型定义是否正确

### 调试技巧
- 使用 `console.log` 进行调试
- 检查React Native调试器
- 查看Expo开发工具日志

## 许可证

MIT License - 详见 LICENSE 文件

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

**Chef iQ** - 让菜单管理变得简单高效 🍽️✨

