# 用户认证管理

## ADDED Requirements

### Requirement: 支持多种登录方式
系统 SHALL 支持用户通过 Google、Apple 或 Email 进行注册和登录。

#### Scenario: Google 登录
- Given 用户点击 "Sign in with Google" 按钮
- When Google OAuth 流程完成
- Then 系统创建或更新用户记录
- And 返回 JWT Token
- And 用户进入登录状态

#### Scenario: Apple 登录
- Given 用户点击 "Sign in with Apple" 按钮
- When Apple Sign-In 流程完成
- Then 系统创建或更新用户记录
- And 返回 JWT Token

#### Scenario: Email 注册
- Given 用户填写邮箱和密码
- When 点击注册按钮
- Then 系统发送验证邮件
- And 用户验证后账户激活

#### Scenario: Email 登录
- Given 用户填写已验证的邮箱和密码
- When 点击登录按钮
- Then 验证凭据正确
- And 返回 JWT Token

### Requirement: localStorage 数据迁移
系统 SHALL 支持已有本地数据的用户将数据迁移到云端账户。

#### Scenario: 登录后检测本地数据
- Given 用户首次登录
- When 系统检测到 localStorage 中有 astro_user 数据
- Then 显示数据迁移提示 Modal
- And 用户可选择迁移或跳过

#### Scenario: 执行数据迁移
- Given 用户确认迁移
- When 调用迁移 API
- Then 本地出生信息同步到云端
- And 本地偏好设置同步到云端
- And 清除 localStorage 数据

### Requirement: 用户资料管理
系统 SHALL 允许登录用户管理个人资料和偏好设置。

#### Scenario: 更新出生信息
- Given 登录用户访问设置页面
- When 修改出生日期/时间/地点
- Then 数据保存到云端
- And 刷新本地缓存

#### Scenario: 更新偏好设置
- Given 登录用户切换主题或语言
- When 设置变更
- Then 同步到云端账户
- And 下次登录自动应用
