# user-onboarding Specification

## Purpose
TBD - created by archiving change add-user-onboarding-flow. Update Purpose after archive.
## Requirements
### Requirement: 新用户登录后进入引导流程
系统 SHALL 在新用户首次登录成功后自动跳转至出生信息收集页面。

#### Scenario: 新用户首次登录
- Given 用户通过微信授权登录成功
- And 用户的 `onboardingCompleted` 为 `false` 或未定义
- When 登录流程完成
- Then 系统跳转至 `/pages/onboarding/onboarding` 页面

#### Scenario: 老用户登录
- Given 用户通过微信授权登录成功
- And 用户的 `onboardingCompleted` 为 `true`
- When 登录流程完成
- Then 系统跳转至首页或用户原目标页面

---

### Requirement: 步骤一收集出生日期与时间
引导页面第一步 SHALL 收集用户的出生日期和时间，MUST 支持阳历和农历选择。

#### Scenario: 使用阳历选择出生日期
- Given 用户在引导页面步骤一
- And 日历类型为「阳历/公历」
- When 用户选择日期 `1990-01-15` 和时间 `14:30`
- Then 系统记录出生日期为 `1990-01-15`
- And 系统记录出生时间为 `14:30`
- And 系统记录 `calendarType` 为 `solar`

#### Scenario: 使用农历选择出生日期
- Given 用户在引导页面步骤一
- And 日历类型切换为「农历」
- When 用户选择农历日期「腊月初八」（1989 年）
- Then 系统调用后端 `/api/calendar/lunar-to-solar` 接口
- And 系统将农历日期转换为公历日期 `1990-01-04`
- And 系统记录出生日期为 `1990-01-04`
- And 系统记录 `calendarType` 为 `lunar`

#### Scenario: 用户不确定具体出生时间
- Given 用户在引导页面步骤一
- When 用户勾选「不确定具体时间」
- Then 时间选择器变为禁用状态
- And 出生时间自动设置为 `12:00`
- And 系统记录 `accuracyLevel` 为 `approximate`

#### Scenario: 用户取消不确定时间勾选
- Given 用户已勾选「不确定具体时间」
- When 用户取消勾选
- Then 时间选择器恢复可用状态
- And 系统记录 `accuracyLevel` 为 `exact`

---

### Requirement: 步骤二收集出生地点
引导页面第二步 SHALL 收集用户的出生城市，MUST 支持模糊搜索功能。

#### Scenario: 使用城市搜索输入出生地点
- Given 用户在引导页面步骤二
- When 用户输入「北京」
- Then 系统显示匹配的城市列表
- And 列表包含「北京, 北京, 中国」

#### Scenario: 使用拼音搜索城市
- Given 用户在引导页面步骤二
- When 用户输入「shanghai」或「sh」
- Then 系统显示匹配的城市列表
- And 列表包含「上海, 上海, 中国」

#### Scenario: 选中城市后自动填充坐标
- Given 用户在城市搜索结果列表中
- When 用户点击「北京, 北京, 中国」
- Then 系统自动填充 `lat` 为 `39.9042`
- And 系统自动填充 `lon` 为 `116.4074`
- And 系统自动填充 `timezone` 为 `8`

---

### Requirement: 完成引导后保存用户资料
系统 SHALL 在用户完成两步引导后保存所有信息并标记引导完成。

#### Scenario: 完成引导流程
- Given 用户已完成步骤一和步骤二
- When 用户点击「完成」按钮
- Then 系统将出生信息保存到 `user_profile`
- And 系统设置 `onboardingCompleted` 为 `true`
- And 系统跳转至首页

#### Scenario: 表单验证失败
- Given 用户在步骤一
- And 用户未选择出生日期
- When 用户点击「下一步」
- Then 系统显示错误提示「请选择出生日期」
- And 系统阻止进入下一步

---

### Requirement: 支持编辑已保存的出生信息
系统 SHALL 允许用户在「我的」页面修改已保存的出生信息。

#### Scenario: 从「我的」页面进入编辑模式
- Given 用户已完成引导
- And 用户在「我的」页面
- When 用户点击「编辑出生资料」
- Then 系统跳转至引导页面
- And 页面标题显示「修改出生资料」
- And 表单预填现有出生信息

#### Scenario: 保存修改后的出生信息
- Given 用户在编辑模式的引导页面
- When 用户修改出生城市并点击「保存」
- Then 系统更新 `user_profile` 中的出生信息
- And 系统返回「我的」页面
- And 系统显示「保存成功」提示

---

### Requirement: 显示计算精度信任标识
引导页面底部 SHALL 显示计算精度说明以增强用户信任。

#### Scenario: 显示信任标识
- Given 用户在引导页面任一步骤
- Then 页面底部显示「基于 Swiss Ephemeris 瑞士星历表和 NASA JPL 数据库精密计算」
- And 信任标识样式符合 UI 规范

---

### Requirement: 后端提供农历转公历接口
后端 SHALL 提供 API 接口将农历日期转换为公历日期。

#### Scenario: 成功转换农历日期
- Given 后端收到 `POST /api/calendar/lunar-to-solar` 请求
- And 请求体为 `{ "year": 1990, "month": 1, "day": 8 }`
- When 后端处理请求
- Then 返回 `{ "success": true, "solarDate": "1990-02-04" }`

#### Scenario: 处理闰月日期
- Given 后端收到 `POST /api/calendar/lunar-to-solar` 请求
- And 请求体为 `{ "year": 2023, "month": 2, "day": 15, "isLeapMonth": true }`
- When 后端处理请求
- Then 返回正确的公历日期
- And `success` 为 `true`

#### Scenario: 农历日期无效
- Given 后端收到 `POST /api/calendar/lunar-to-solar` 请求
- And 请求体为 `{ "year": 1990, "month": 13, "day": 1 }`
- When 后端处理请求
- Then 返回 `{ "success": false, "error": "无效的农历月份" }`

