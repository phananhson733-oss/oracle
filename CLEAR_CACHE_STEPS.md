# 🧹 清除缓存步骤

## Chrome 浏览器完全清除缓存

### 方法 1: 硬刷新（推荐）

1. **打开应用页面**
2. **按以下组合键**：
   - **Mac**: `Cmd + Shift + R` 或 `Cmd + Option + R`
   - **Windows**: `Ctrl + Shift + R` 或 `Ctrl + F5`

### 方法 2: 清除站点数据

1. **打开开发者工具**：按 `F12` 或右键 → "检查"
2. **Application（应用）标签页**
3. 左侧展开 **"Storage"（存储）**
4. 点击 **"Clear site data"（清除站点数据）**
5. 勾选所有选项
6. 点击 **"Clear site data"**
7. 关闭并重新打开浏览器标签页

### 方法 3: 无痕模式测试

1. **打开无痕窗口**：
   - **Mac**: `Cmd + Shift + N`
   - **Windows**: `Ctrl + Shift + N`
2. 访问应用 URL
3. 登录并测试支付

### 方法 4: 禁用缓存（开发模式）

1. **打开开发者工具**：`F12`
2. **Network（网络）标签页**
3. 勾选 **"Disable cache"（禁用缓存）**
4. **保持开发者工具打开**的状态下刷新页面

---

## 前端重新构建

如果上述方法都不行，可能需要重新构建前端：

```bash
# 停止前端（如果正在运行）
# 按 Ctrl+C

# 删除构建缓存
rm -rf node_modules/.vite
rm -rf dist

# 重新启动
npm run dev
```

---

## 验证是否生效

清除缓存后，测试支付时应该跳转到：
- ✅ **https://www.sandbox.paypal.com/...**
- ❌ ~~https://www.paypal.com/...~~

如果还是跳转到 www.paypal.com，请检查 Network 标签页中的 API 响应。
