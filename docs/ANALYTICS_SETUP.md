# Analytics 追踪配置指南

本文档详细说明如何获取并配置此项目的 Google Analytics 4 (GA4) 和 Google Tag Manager (GTM) 凭据。

## 前置要求

- 一个 Google 账号
- 访问 [Google Analytics](https://analytics.google.com/)
- 访问 [Google Tag Manager](https://tagmanager.google.com/)

## 1. Google Analytics 4 (GA4) 配置

### 步骤 1.1：创建 GA4 媒体资源
1. 登录 Google Analytics。
2. 点击左下角的 **"管理"** (Admin)。
3. 在 "媒体资源" (Property) 列，点击 **"创建媒体资源"** (Create Property)。
4. 输入媒体资源名称（例如：`AstrologyWiki`），选择时区和货币。
5. 点击 **"下一步"** 并根据提示完成业务详细信息。

### 步骤 1.2：创建数据流
1. 在媒体资源的 **"数据收集和修改"** > **"数据流"** (Data Streams) 中。
2. 点击 **"添加数据流"** 并选择 **"网站"** (Web)。
3. 输入网站 URL（开发环境可填写 `http://localhost:5173`）和数据流名称。
4. 确保启用了 **"增强型衡量功能"** (Enhanced measurement)。
5. 点击 **"创建数据流"**。

### 步骤 1.3：获取衡量 ID (Measurement ID)
1. 创建完成后，你会看到 **"衡量 ID"**（格式通常为 `G-XXXXXXXXXX`）。
2. 复制此 ID，稍后将用于环境变量配置。

---

## 2. Google Tag Manager (GTM) 配置

### 步骤 2.1：创建容器
1. 登录 Google Tag Manager。
2. 点击 **"创建账号"** (Create Account) 或选择现有账号并点击 **"创建容器"** (Create Container)。
3. 容器名称：`AstrologyWiki-Web`。
4. 目标平台：选择 **"网站"** (Web)。
5. 点击 **"创建"**。

### 步骤 2.2：配置 GA4 代码
1. 在 GTM 工作区，点击 **"代码"** (Tags) > **"新建"**。
2. 命名为：`GA4 - Config`。
3. 代码配置：选择 **"Google Analytics：GA4 配置"**。
4. 衡量 ID：输入你在步骤 1.3 中获取的 ID。
5. 触发条件：选择 **"Initialization - All Pages"** 或 **"All Pages"**。
6. 点击 **"保存"**。

### 步骤 2.3：获取容器 ID (Container ID)
1. 在 GTM 顶部导航栏，你会看到格式为 `GTM-XXXXXXX` 的 ID。
2. 复制此 ID。

---

## 3. 环境变量配置

在项目根目录的 `.env.local` 文件中添加以下配置：

```bash
# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=你的衡量ID (G-XXXXXXXXXX)

# Google Tag Manager
VITE_GTM_CONTAINER_ID=你的容器ID (GTM-XXXXXXX)
```

> **注意**: 更改环境变量后需要重启开发服务器 (`npm run dev`) 才能生效。

---

## 4. 隐私合规与用户授权 (Consent)

本项目遵循隐私优先原则，分析脚本仅在用户授权后加载。

- **逻辑控制**: 详见 `services/analytics.ts` 和 `services/consent.ts`。
- **行为**: 只有当 `localStorage` 中的 `astro_analytics_consent` 值为 `granted` 时，追踪脚本才会注入页面。
- **手动触发**: 用户通过 UI（如 Cookie 橫幅）点击同意后，会调用 `grantAnalyticsConsent()` 并初始化分析服务。

---

## 5. 验证追踪是否生效

### 方式 A：GA4 DebugView（推荐）
1. 在 Google Analytics 管理界面中，找到 **"显示数据"** > **"DebugView"**。
2. 开启 GTM 预览模式（见下文）或安装 [Google Analytics Debugger](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdakmhlmcnbaopbedgaoabggocno) 插件。
3. 检查是否有实时事件流入。

### 方式 B：GTM 预览模式
1. 在 GTM 工作区点击右上角的 **"预览"** (Preview)。
2. 输入本地运行地址 `http://localhost:5173`。
3. 在弹出的 Tag Assistant 窗口中确认 `GA4 - Config` 标签状态为 **"Succeeded"**。

### 方式 C：浏览器控制台
1. 打开浏览器开发者工具（F12）。
2. 在 **Network** 标签页搜索 `collect`，确认有请求发往 `google-analytics.com`。
3. 检查是否有 ID 为 `astro-ga4` 或 `astro-gtm` 的 `<script>` 标签成功插入到 `<head>` 中。

---

## 6. 维护建议

- **事件命名**: 统一使用下划线命名法（snake_case），如 `signup_completed`。
- **版本控制**: GTM 容器变更后务必点击 **"提交"** 并发布新版本。
- **安全性**: 环境变量 ID 虽非严格保密信息，但仍建议通过环境配置文件管理，避免硬编码。
