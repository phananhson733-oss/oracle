# Google OAuth 配置指南

本文档详细说明如何为 AstrologyWiki 配置 Google OAuth 登录功能。

## 前置要求

- Google 账号
- 访问 [Google Cloud Console](https://console.cloud.google.com/)

## 步骤 1: 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部导航栏的项目选择器
3. 点击 **"新建项目"** (New Project)
4. 输入项目名称，例如：`AstrologyWiki`
5. 点击 **"创建"** (Create)
6. 等待项目创建完成（通常需要几秒钟）

## 步骤 2: 启用 Google+ API

1. 在左侧菜单中，选择 **"API 和服务"** > **"库"** (APIs & Services > Library)
2. 搜索 `Google+ API` 或 `Google Identity`
3. 点击 **"Google+ API"**
4. 点击 **"启用"** (Enable)

> **注意**: 如果找不到 Google+ API，可以启用 **"Google Identity Services"** 或 **"People API"**

## 步骤 3: 配置 OAuth 同意屏幕

1. 在左侧菜单中，选择 **"API 和服务"** > **"OAuth 同意屏幕"** (OAuth consent screen)
2. 选择用户类型：
   - **外部** (External): 任何 Google 账号都可以登录（推荐用于生产环境）
   - **内部** (Internal): 仅限组织内部用户（仅适用于 Google Workspace）
3. 点击 **"创建"** (Create)

### 3.1 应用信息

填写以下信息：

- **应用名称**: `AstrologyWiki`
- **用户支持电子邮件**: 你的邮箱地址
- **应用徽标**: （可选）上传应用图标
- **应用首页**: `https://yourdomain.com`
- **应用隐私政策链接**: `https://yourdomain.com/privacy`
- **应用服务条款链接**: `https://yourdomain.com/terms`
- **授权网域**:
  - 生产环境: `yourdomain.com`
  - 开发环境: `localhost`

### 3.2 作用域 (Scopes)

点击 **"添加或移除作用域"** (Add or Remove Scopes)，选择以下作用域：

- `../auth/userinfo.email` - 查看用户的电子邮件地址
- `../auth/userinfo.profile` - 查看用户的基本个人资料信息
- `openid` - OpenID Connect 身份验证

点击 **"更新"** (Update)，然后点击 **"保存并继续"** (Save and Continue)

### 3.3 测试用户（开发阶段）

如果选择了 **"外部"** 用户类型且应用处于测试模式：

1. 点击 **"添加用户"** (Add Users)
2. 输入测试用户的 Gmail 地址
3. 点击 **"保存并继续"** (Save and Continue)

> **注意**: 测试模式下，只有添加的测试用户才能登录。发布应用后，所有 Google 用户都可以登录。

## 步骤 4: 创建 OAuth 2.0 凭据

1. 在左侧菜单中，选择 **"API 和服务"** > **"凭据"** (Credentials)
2. 点击顶部的 **"创建凭据"** (Create Credentials)
3. 选择 **"OAuth 客户端 ID"** (OAuth client ID)
4. 选择应用类型：**"Web 应用"** (Web application)

### 4.1 配置 Web 应用

填写以下信息：

- **名称**: `AstrologyWiki Web Client`

- **已获授权的 JavaScript 来源** (Authorized JavaScript origins):
  ```
  http://localhost:5173
  http://localhost:3000
  https://yourdomain.com
  ```

- **已获授权的重定向 URI** (Authorized redirect URIs):
  ```
  http://localhost:5173/auth/callback
  http://localhost:3000/auth/callback
  https://yourdomain.com/auth/callback
  https://api.yourdomain.com/api/auth/google/callback
  ```

5. 点击 **"创建"** (Create)

## 步骤 5: 获取凭据

创建成功后，会显示一个弹窗，包含：

- **客户端 ID** (Client ID): 类似 `123456789-abcdefg.apps.googleusercontent.com`
- **客户端密钥** (Client Secret): 类似 `GOCSPX-abcdefghijklmnop`

**重要**: 请妥善保存这些凭据，特别是客户端密钥！

## 步骤 6: 配置环境变量

### 6.1 后端配置

编辑 `backend/.env` 文件，添加以下配置：

```bash
# Google OAuth
GOOGLE_CLIENT_ID=你的客户端ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=你的客户端密钥
```

### 6.2 前端配置

编辑前端的环境变量文件（`.env` 或 `.env.local`）：

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=你的客户端ID.apps.googleusercontent.com
```

> **注意**: 前端只需要 Client ID，不需要 Client Secret

## 步骤 7: 验证配置

### 7.1 测试后端

启动后端服务：

```bash
cd backend
npm run dev
```

检查日志，确认 Google OAuth 已配置：

```
✓ Google OAuth configured
```

### 7.2 测试前端登录

1. 启动前端应用
2. 点击 **"使用 Google 登录"** 按钮
3. 应该会弹出 Google 登录窗口
4. 选择账号并授权
5. 成功后应该跳转回应用并完成登录

## 常见问题

### Q1: 出现 "redirect_uri_mismatch" 错误

**原因**: 重定向 URI 不匹配

**解决方案**:
1. 检查前端发起的重定向 URI 是否与 Google Console 中配置的完全一致
2. 确保包含协议（http/https）、域名、端口和路径
3. 注意尾部斜杠（有些配置需要，有些不需要）

### Q2: 出现 "access_denied" 错误

**原因**: 用户未在测试用户列表中（测试模式）

**解决方案**:
1. 在 OAuth 同意屏幕中添加测试用户
2. 或者将应用发布到生产环境

### Q3: 出现 "invalid_client" 错误

**原因**: Client ID 或 Client Secret 不正确

**解决方案**:
1. 检查环境变量中的凭据是否正确
2. 确保没有多余的空格或换行符
3. 重新生成凭据并更新配置

### Q4: 如何发布应用到生产环境？

1. 在 OAuth 同意屏幕页面
2. 点击 **"发布应用"** (Publish App)
3. 如果应用需要敏感作用域，可能需要 Google 审核（通常需要几天到几周）
4. 对于基本的 email 和 profile 作用域，通常可以立即发布

## 安全建议

1. **永远不要将 Client Secret 提交到版本控制系统**
2. **使用环境变量管理敏感信息**
3. **定期轮换 Client Secret**
4. **为生产环境和开发环境使用不同的 OAuth 客户端**
5. **限制授权域名和重定向 URI**

## 参考资源

- [Google Identity 官方文档](https://developers.google.com/identity)
- [OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
