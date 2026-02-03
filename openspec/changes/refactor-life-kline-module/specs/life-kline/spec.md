# Life K-Line Capability

人生K线功能规范 - 以占星周期为基础，融合东西方智慧的人生运势可视化与深度解读。

---

## ADDED Requirements

### Requirement: K-Line Data Generation

系统 SHALL 基于用户出生信息生成100年的人生K线数据，融合西方占星周期与中国干支体系。

#### Scenario: Generate K-Line data for user

- **GIVEN** 用户已提供出生日期、时间、地点
- **WHEN** 请求生成K线数据
- **THEN** 系统返回100条K线数据（1-100岁），每条包含：
  - 年份、年龄
  - 干支信息（天干、地支、完整干支）
  - 开盘值、收盘值、最高值、最低值（0-100范围）
  - 综合评分
  - 涨跌趋势（bull/bear）
  - 重要节点标记（土星回归、木星回归、天王星对分相）

#### Scenario: Saturn return marking

- **GIVEN** K线数据生成中
- **WHEN** 年龄在 28-30 或 58-60 范围内
- **THEN** 该年份 `isSaturnReturn` 标记为 true
- **AND** 综合评分受到负向影响（-12分基础）

#### Scenario: Jupiter return marking

- **GIVEN** K线数据生成中
- **WHEN** 年龄为12的倍数附近（±1年）
- **THEN** 该年份 `isJupiterReturn` 标记为 true
- **AND** 综合评分受到正向影响（+15分基础）

#### Scenario: Uranus opposition marking

- **GIVEN** K线数据生成中
- **WHEN** 年龄在 40-44 范围内
- **THEN** 该年份 `isUranusOpposition` 标记为 true
- **AND** 综合评分受到负向影响（-8分基础）

---

### Requirement: K-Line Chart Visualization

系统 SHALL 在微信小程序中使用 Canvas 2D 绘制真实的K线蜡烛图。

#### Scenario: Render candlestick chart

- **GIVEN** 已获取K线数据
- **WHEN** 进入K线页面
- **THEN** Canvas 绘制K线图，包含：
  - Y轴：0-100刻度
  - X轴：年龄标签
  - 每个K线柱体显示开/收/高/低
  - 涨（收>开）显示绿色
  - 跌（收<开）显示红色

#### Scenario: Mark special nodes on chart

- **GIVEN** K线图已绘制
- **WHEN** 某年份有重要节点标记
- **THEN** 在该K线柱体上方显示紫色圆点标记

#### Scenario: Mark current year on chart

- **GIVEN** K线图已绘制
- **WHEN** 某年份为当前年
- **THEN** 在该K线柱体上方显示橙色圆点标记

#### Scenario: Switch view range

- **GIVEN** K线图显示中
- **WHEN** 用户选择「1-50岁」「51-100岁」或「全部」
- **THEN** 图表仅显示对应范围的K线数据
- **AND** 图表重新绘制以适应显示范围

---

### Requirement: Year Detail Modal

系统 SHALL 提供年度详情弹窗，展示选定年份的深度运势解读。

#### Scenario: Open year detail modal

- **GIVEN** K线图显示中
- **WHEN** 用户点击某年份的K线柱体
- **THEN** 显示年度详情弹窗
- **AND** Canvas 组件使用 `wx:if` 隐藏（避免层级问题）

#### Scenario: Display year overview tab

- **GIVEN** 年度详情弹窗打开
- **WHEN** 用户在「概览」Tab
- **THEN** 显示以下内容：
  - 年份、干支、年龄
  - 年度主题（如「土星回归·人生结构重建」）
  - 吉/凶标签
  - K线数据（开/收/高/低）
  - 四维评分条（事业/财运/感情/健康）
  - 重要事件卡片（如有）
  - 占星视角摘要
  - 八字视角摘要
  - 行动建议（必做/禁忌清单）
  - 个性化寄语

#### Scenario: Display dimension tabs

- **GIVEN** 年度详情弹窗打开
- **WHEN** 用户切换到「事业」「财运」「感情」或「健康」Tab
- **THEN** 显示该维度的评分条和详细分析文本

#### Scenario: Display monthly tab

- **GIVEN** 年度详情弹窗打开
- **WHEN** 用户切换到「月度」Tab
- **THEN** 显示12个月的运势表格，每月包含：
  - 星级评分（1-5星）
  - 关键词
  - 注意事项

#### Scenario: Close modal and redraw canvas

- **GIVEN** 年度详情弹窗打开
- **WHEN** 用户关闭弹窗
- **THEN** 弹窗隐藏
- **AND** 延迟50ms后重绘 Canvas K线图

---

### Requirement: Full Report View

系统 SHALL 提供完整报告视图，包含人生运势的系统性解读章节。

#### Scenario: Display free report sections

- **GIVEN** 用户进入完整报告视图
- **WHEN** 页面加载完成
- **THEN** 以下章节可展开查看（免费）：
  - 人生运势总览
  - 过去：命运回溯
  - 现在：当下定位

#### Scenario: Display locked report sections

- **GIVEN** 用户进入完整报告视图
- **AND** 用户未购买K线报告解锁
- **AND** 用户非订阅会员
- **WHEN** 页面加载完成
- **THEN** 以下章节显示锁定状态：
  - 未来30年运势详解
  - 人生里程碑预测
  - 给未来的你
- **AND** 显示「解锁完整报告 ¥29.9」按钮

#### Scenario: Unlock report for paid users

- **GIVEN** 用户已购买K线报告解锁 或 用户为订阅会员
- **WHEN** 进入完整报告视图
- **THEN** 所有章节均可展开查看

---

### Requirement: Payment Integration

系统 SHALL 支持K线深度报告的付费解锁。

#### Scenario: Purchase K-Line report unlock

- **GIVEN** 用户查看锁定的报告章节
- **WHEN** 用户点击「解锁完整报告 ¥29.9」
- **THEN** 调起 Stripe 支付流程
- **AND** 支付成功后解锁所有报告章节
- **AND** 记录用户已购买状态

#### Scenario: Subscription user auto-unlock

- **GIVEN** 用户为有效订阅会员
- **WHEN** 进入K线页面
- **THEN** 自动解锁所有付费内容
- **AND** 不显示购买按钮

---

### Requirement: Natal Chart Display

系统 SHALL 在K线页面显示用户的本命盘关键信息。

#### Scenario: Display natal signs

- **GIVEN** 用户已提供出生信息
- **WHEN** K线页面加载
- **THEN** 在输入区域下方显示：
  - 太阳星座（名称 + 符号）
  - 月亮星座（名称 + 符号）
  - 上升星座（名称 + 符号）

---

### Requirement: Current Year Card

系统 SHALL 在K线图下方显示当年运势卡片。

#### Scenario: Display current year fortune

- **GIVEN** K线数据已生成
- **WHEN** K线图视图显示
- **THEN** 显示当年运势卡片，包含：
  - 年份
  - 干支
  - 年龄
  - 吉/凶标签
  - 综合运势评分条
  - 「点击查看详细年度报告」提示

#### Scenario: Click current year card

- **GIVEN** 当年运势卡片显示
- **WHEN** 用户点击卡片
- **THEN** 打开当年的年度详情弹窗

---

### Requirement: Important Milestones List

系统 SHALL 在K线页面显示人生重要节点列表。

#### Scenario: Display milestone list

- **GIVEN** K线数据已生成
- **WHEN** K线图视图显示
- **THEN** 在页面底部显示「人生重要节点」列表
- **AND** 列出土星回归和天王星对分相年份（最多5个）
- **AND** 每项显示年份、年龄、事件类型

#### Scenario: Click milestone item

- **GIVEN** 重要节点列表显示
- **WHEN** 用户点击某个节点
- **THEN** 打开该年份的年度详情弹窗

---

### Requirement: API Endpoints

系统 SHALL 提供 K线数据和年度报告的 API 端点。

#### Scenario: GET /api/kline/generate

- **GIVEN** 请求包含有效的出生信息参数
- **WHEN** 调用 `/api/kline/generate`
- **THEN** 返回 JSON 响应：
  ```json
  {
    "klineData": [...],
    "natalChart": {
      "sunSign": {...},
      "moonSign": {...},
      "ascendant": {...}
    }
  }
  ```

#### Scenario: GET /api/kline/year-report

- **GIVEN** 请求包含出生信息、年份和用户ID
- **AND** 用户有权限查看（已付费或订阅用户）
- **WHEN** 调用 `/api/kline/year-report`
- **THEN** 返回完整的年度报告 JSON

#### Scenario: GET /api/kline/year-report unauthorized

- **GIVEN** 请求包含出生信息和年份
- **AND** 用户未付费且非订阅用户
- **WHEN** 调用 `/api/kline/year-report`
- **THEN** 返回 `{ "requiresPayment": true }` 响应
