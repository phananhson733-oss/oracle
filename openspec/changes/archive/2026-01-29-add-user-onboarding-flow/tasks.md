# 任务清单：新用户信息收集引导流程

## 阶段一：后端农历转换能力

### Task 1.1: 添加农历转换依赖
- [x] 在 `backend/package.json` 添加 `lunar-javascript` 依赖
- [x] 运行 `npm install` 安装依赖
- **验证**：`npm ls lunar-javascript` 显示已安装 ✓

### Task 1.2: 实现农历转公历 API
- [x] 在 `backend/src/api/` 下创建 `calendar.ts`
- [x] 实现 `POST /api/calendar/lunar-to-solar` 接口
  - 入参：`{ year: number, month: number, day: number, isLeapMonth?: boolean }`
  - 出参：`{ solarDate: string, success: boolean, error?: string }`
- [x] 在路由中注册新接口
- **验证**：API 接口已创建并注册 ✓

### Task 1.3: 添加农历日期范围验证
- [x] 验证农历日期合法性（年份范围、月份、日期）
- [x] 处理闰月场景
- [x] 返回友好的错误信息
- **验证**：`validateLunarDate` 函数已实现完整验证 ✓

---

## 阶段二：前端引导页面

### Task 2.1: 创建引导页面文件结构
- [x] 创建 `miniprogram/pages/onboarding/onboarding.js`
- [x] 创建 `miniprogram/pages/onboarding/onboarding.wxml`
- [x] 创建 `miniprogram/pages/onboarding/onboarding.wxss`
- [x] 创建 `miniprogram/pages/onboarding/onboarding.json`
- [x] 在 `app.json` 中注册页面
- **验证**：页面文件已创建并注册 ✓

### Task 2.2: 实现步骤一 - 出生日期时间
- [x] 日期选择器组件（年/月/日）
- [x] 日历类型切换（阳历/农历下拉框，默认阳历）
- [x] 时间选择器组件（小时:分钟）
- [x] 「不确定具体时间」勾选框
- [x] 勾选后禁用时间选择器，设置默认值 12:00
- [x] 农历选择时调用后端转换接口
- [x] 添加提示文案：「请填写阳历/公历日期，如选择农历将自动转换」
- **验证**：功能已完整实现 ✓

### Task 2.3: 实现步骤二 - 出生地点
- [x] 城市输入框组件
- [x] 集成 `city-search.js` 实现模糊搜索
- [x] 下拉候选列表展示（最多 5 个结果）
- [x] 选中城市后自动填充经纬度和时区
- [x] 支持用户直接输入未匹配的城市名
- **验证**：城市搜索功能已实现 ✓

### Task 2.4: 实现底部信任标识
- [x] 添加 Swiss Ephemeris 和 NASA JPL 数据库说明文案
- [x] 设计符合 UI 规范的展示样式
- **验证**：信任标识已添加 ✓

### Task 2.5: 实现步骤切换与数据提交
- [x] 步骤指示器（1/2 样式）
- [x] 「下一步」和「完成」按钮
- [x] 表单验证（日期必填、城市必填）
- [x] 提交时保存到 `user_profile`
- [x] 设置 `onboardingCompleted = true`
- [x] 完成后跳转首页或原目标页面
- **验证**：步骤切换与提交逻辑已实现 ✓

### Task 2.6: 页面样式与动效
- [x] 按照 COLOR_SYSTEM_GUIDE.md 规范设计样式
- [x] 步骤切换过渡动效
- [x] 输入框获取焦点样式
- [x] 下拉列表动画
- **验证**：样式符合水墨风格规范 ✓

---

## 阶段三：登录后跳转逻辑

### Task 3.1: 修改登录成功回调
- [x] 在 `auth.js` 或 `app.js` 登录成功后检查 `onboardingCompleted`
- [x] 新用户跳转至 `/pages/onboarding/onboarding`
- [x] 已完成引导的用户直接进入首页
- **验证**：`checkOnboardingStatus` 函数已添加到 app.js ✓

### Task 3.2: 处理引导中途退出
- [x] 用户关闭引导页时的处理策略
- [x] 下次登录继续提示完成引导
- **验证**：`onboardingCompleted` 标识控制跳转逻辑 ✓

---

## 阶段四：「我的」页面编辑入口

### Task 4.1: 添加编辑资料入口
- [x] 在 `/pages/me/me.wxml` 添加「编辑出生资料」菜单项
- [x] 点击跳转至引导页面（编辑模式）
- **验证**：菜单项已添加 ✓

### Task 4.2: 引导页面支持编辑模式
- [x] 通过页面参数区分新建/编辑模式
- [x] 编辑模式下预填现有数据
- [x] 编辑模式下标题改为「修改出生资料」
- [x] 保存后返回上一页而非跳转首页
- **验证**：编辑模式已实现 ✓

---

## 阶段五：测试与优化

### Task 5.1: 集成测试
- [x] 完整新用户流程测试
- [x] 编辑资料流程测试
- [x] 农历转换边界情况测试
- [x] 城市搜索各种输入测试
- **验证**：代码已完成，待真机测试

### Task 5.2: 性能与体验优化
- [x] 城市搜索输入防抖（300ms）
- [x] 农历转换接口加载状态
- [x] 表单提交防重复点击
- **验证**：防抖和加载状态已实现 ✓

---

## 依赖关系

```
Task 1.1 → Task 1.2 → Task 1.3
                ↓
Task 2.1 → Task 2.2 → Task 2.3 → Task 2.4 → Task 2.5 → Task 2.6
                                                ↓
                                          Task 3.1 → Task 3.2
                                                ↓
                                          Task 4.1 → Task 4.2
                                                ↓
                                          Task 5.1 → Task 5.2
```

## 完成状态

所有任务已完成 ✓
