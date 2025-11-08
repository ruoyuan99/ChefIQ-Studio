# 修复网络连接错误

## 问题
`Network request failed` - 无法连接到后端服务器

## 快速解决方案

### 方案 1: 如果你在使用真实设备（推荐）

1. 打开 `src/config/recipeImport.ts`
2. 找到你的设备类型，取消注释局域网 IP 配置：

**对于真实 iOS 设备：**
```typescript
// 在 getDevBackendUrl 函数中，iOS 部分：
// 将这行：
return 'http://localhost:3001';

// 改为：
return `http://192.168.10.153:3001`; // 使用你的计算机 IP
```

**对于真实 Android 设备：**
```typescript
// 在 getDevBackendUrl 函数中，Android 部分：
// 将这行：
return 'http://10.0.2.2:3001';

// 改为：
return `http://192.168.10.153:3001`; // 使用你的计算机 IP
```

3. 确保你的设备和计算机在同一个 Wi-Fi 网络
4. 重启应用

### 方案 2: 如果你在使用模拟器/仿真器

**iOS 模拟器：**
- 应该使用 `localhost:3001`（默认配置）
- 确保后端服务器正在运行

**Android 模拟器：**
- 应该使用 `10.0.2.2:3001`（默认配置）
- 确保后端服务器正在运行

### 检查步骤

1. **确认后端服务器运行：**
```bash
curl http://localhost:3001/health
```

2. **检查你的计算机 IP：**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
当前 IP: `192.168.10.153`

3. **测试从设备访问服务器（如果可能）：**
在设备浏览器中访问：`http://192.168.10.153:3001/health`

## 当前配置

- 计算机 IP: `192.168.10.153`
- 后端端口: `3001`
- 配置文件: `src/config/recipeImport.ts`

## 临时快速修复

如果你想快速测试，可以临时修改配置：

1. 打开 `src/config/recipeImport.ts`
2. 临时使用局域网 IP（适用于所有情况）：

```typescript
const getDevBackendUrl = (): string => {
  // 临时：使用局域网 IP（适用于真实设备和某些模拟器）
  return 'http://192.168.10.153:3001';
};
```

3. 保存并重启应用

## 常见问题

### Q: 为什么模拟器不能访问 localhost？
A: 
- iOS 模拟器：可以访问 localhost
- Android 模拟器：需要使用 `10.0.2.2` 而不是 `localhost`

### Q: 真实设备为什么不能访问 localhost？
A: 真实设备上的 "localhost" 指向设备本身，不是你的计算机。需要使用计算机的局域网 IP。

### Q: 如何找到我的计算机 IP？
A: 
- macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig` 然后查找 IPv4 地址

### Q: 防火墙阻止连接怎么办？
A: 
- 确保防火墙允许端口 3001 的传入连接
- 或者临时关闭防火墙测试

