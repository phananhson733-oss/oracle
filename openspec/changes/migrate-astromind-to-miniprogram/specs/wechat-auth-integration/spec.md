<!-- INPUT: 微信授权集成的增量规范。 -->
<!-- OUTPUT: 微信授权的需求和场景定义。 -->
<!-- POS: 增量规范文档；若更新此文件，务必更新本头注释。 -->

# Capability: Wechat Auth Integration

## Purpose
实现微信授权登录，包括小程序端的 wx.login() 调用、后端的 code2Session API 集成、JWT token 生成和管理，确保用户可以安全登录并访问需要认证的功能。

## ADDED Requirements

### Requirement: 微信登录流程
小程序 SHALL 实现微信授权登录，获取用户 openid 和 token（wx.login, code2Session, JWT）。

#### Scenario: 小程序启动自动登录
- **WHEN** 用户打开小程序且 app.js 的 onLaunch 生命周期触发
- **THEN** 调用 wx.login() 获取 code，将 code 发送到后端 /api/auth/wechat，后端返回 access_token 和 refresh_token，将 token 存储到 wx.storage

#### Scenario: 用户授权获取信息
- **WHEN** 用户点击授权按钮
- **THEN** 调用 wx.getUserProfile() 获取用户信息，将用户信息发送到后端，后端更新用户记录，更新 app.globalData.userInfo

### Requirement: 后端微信授权 API
后端 SHALL 实现微信授权 API，处理 code2Session 和 token 生成（/api/auth/wechat, code2Session, JWT）。

#### Scenario: 实现 /api/auth/wechat 端点
- **WHEN** 后端接收到 POST /api/auth/wechat 请求
- **THEN** 验证 code 参数，调用微信 code2Session API，获取 openid/session_key/unionid，查询或创建用户记录，生成 JWT access_token 和 refresh_token，返回 token 和用户信息

#### Scenario: 调用微信 code2Session API
- **WHEN** 调用微信 API
- **THEN** 请求参数包含 appid, secret, js_code, grant_type，响应包含 openid, session_key, unionid

### Requirement: JWT Token 管理
后端 SHALL 实现 JWT token 的生成、验证和刷新（access_token 15 分钟, refresh_token 7 天）。

#### Scenario: 生成 Access Token
- **WHEN** 用户登录成功
- **THEN** token 包含 userId, openid, iat, exp（15 分钟后）, iss（"astromind-miniprogram"）

#### Scenario: 验证 Access Token
- **WHEN** 小程序请求需要认证的 API
- **THEN** 从请求头 Authorization 中提取 token，验证 token 签名，检查 token 是否过期，从 token 中提取 userId，将 userId 附加到 req.user

#### Scenario: 刷新 Access Token
- **WHEN** access_token 已过期且小程序调用 /api/auth/refresh
- **THEN** 验证 refresh_token 有效性，从 refresh_token 中提取 userId，生成新的 access_token，返回新的 access_token

### Requirement: 认证中间件
后端 SHALL 实现认证中间件，保护需要登录的 API（optionalAuthMiddleware, requireAuth）。

#### Scenario: 可选认证中间件
- **WHEN** API 端点使用 optionalAuthMiddleware
- **THEN** 如果请求包含有效 token，将用户信息附加到 req.user，如果请求不包含 token 或 token 无效，继续处理请求但 req.user 为 null

#### Scenario: 强制认证中间件
- **WHEN** API 端点使用 requireAuth 中间件
- **THEN** 如果请求包含有效 token，将用户信息附加到 req.user，如果请求不包含 token 或 token 无效，返回 401 错误

### Requirement: 小程序 Token 管理
小程序 SHALL 实现 token 的存储、读取和自动刷新（wx.storage, Authorization header, 401 自动刷新）。

#### Scenario: 存储 Token
- **WHEN** 后端返回 token
- **THEN** 将 access_token 和 refresh_token 存储到 wx.storage

#### Scenario: 读取 Token
- **WHEN** 小程序需要调用需要认证的 API
- **THEN** 从 wx.storage 读取 access_token 并添加到请求头 Authorization: Bearer <access_token>

#### Scenario: 自动刷新 Token
- **WHEN** API 返回 401 错误（token 过期）
- **THEN** 从 wx.storage 读取 refresh_token，调用 /api/auth/refresh 获取新的 access_token，更新 wx.storage 中的 access_token，重新发送原始请求

### Requirement: 用户信息管理
后端 SHALL 实现用户信息的查询和更新（GET /api/user/profile, PUT /api/user/profile）。

#### Scenario: 查询用户信息
- **WHEN** 用户已登录且调用 GET /api/user/profile
- **THEN** 返回用户信息（id, name, avatar, wechat_openid, birth_profile, preferences）

#### Scenario: 更新用户信息
- **WHEN** 用户需要更新个人信息且调用 PUT /api/user/profile
- **THEN** 验证用户已登录，验证请求数据有效性，更新数据库中的用户记录，返回更新后的用户信息

### Requirement: 登出功能
小程序 SHALL 实现登出功能，清除本地数据（清除 token, 清除 globalData, 跳转登录页）。

#### Scenario: 用户登出
- **WHEN** 用户点击登出按钮
- **THEN** 清除 wx.storage 中的 access_token 和 refresh_token，清除 app.globalData.userInfo，跳转到登录页面

## MODIFIED Requirements

无

## REMOVED Requirements

无
