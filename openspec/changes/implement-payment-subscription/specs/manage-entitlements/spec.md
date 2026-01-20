# 权益管理

## ADDED Requirements

### Requirement: 免费权益
系统 SHALL 为未登录或免费用户提供基础免费权益。

#### Scenario: 本命盘免费查看
- **GIVEN** 任意用户访问应用
- **WHEN** 输入出生信息
- **THEN** 可免费查看本命盘可视化
- **AND** 可免费查看技术数据表格
- **AND** 无次数限制

#### Scenario: Ask 免费额度
- **GIVEN** 未订阅用户提交 Ask 问答
- **WHEN** 本周剩余额度大于 0
- **THEN** 消耗免费额度
- **AND** 每周免费 3 次
- **AND** 显示剩余次数与重置时间

#### Scenario: 合盘免费额度
- **GIVEN** 未订阅用户生成合盘
- **WHEN** 合盘免费额度仍有剩余
- **THEN** 允许生成合盘
- **AND** 永久免费 3 次
- **AND** 显示剩余次数

#### Scenario: 探索自我前 2 个维度免费
- **GIVEN** 未订阅用户访问探索自我
- **WHEN** 查看前 2 个心理维度
- **THEN** 直接展示内容
- **AND** 后续维度触发付费墙

#### Scenario: Synthetica 免费日额度
- **GIVEN** 未订阅用户使用 Synthetica
- **WHEN** 当日剩余额度大于 0
- **THEN** 消耗免费额度
- **AND** 每日免费 3 次

### Requirement: 订阅权益
系统 SHALL 为订阅用户提供扩展权益。

#### Scenario: 订阅解锁查看详情
- **GIVEN** 订阅用户访问任意内容详情
- **WHEN** 触发解锁校验
- **THEN** 允许直接访问
- **AND** 不消耗积分

#### Scenario: 订阅增加 Ask 与合盘额度
- **GIVEN** 订阅用户提交 Ask 或生成合盘
- **WHEN** 免费额度已用尽
- **THEN** 继续使用订阅额度
- **AND** Ask 每周 +2 次
- **AND** 合盘每周 +2 次

#### Scenario: 订阅增加 Synthetica 日额度
- **GIVEN** 订阅用户使用 Synthetica
- **WHEN** 当日免费额度已用尽
- **THEN** 仍可使用订阅额度
- **AND** 每日 +7 次

#### Scenario: 订阅自动解锁 CBT 统计
- **GIVEN** 订阅用户访问 CBT 统计
- **WHEN** 页面加载
- **THEN** 自动解锁当月统计解读

#### Scenario: 订阅报告折扣
- **GIVEN** 订阅用户购买报告
- **WHEN** 查看价格
- **THEN** 显示折扣价与原价
- **AND** 以折扣价结算

#### Scenario: 订阅赠送积分
- **GIVEN** 用户订阅生效
- **WHEN** 订阅支付成功
- **THEN** 发放 500 积分到余额
- **AND** 在权益列表中展示订阅赠送积分

### Requirement: 积分余额
系统 SHALL 为登录用户维护积分余额并支持 GM 发放积分。

#### Scenario: 查询积分余额
- **GIVEN** 登录用户请求权益状态
- **WHEN** 权益接口返回结果
- **THEN** 返回当前积分余额
- **AND** 与订阅/免费额度同时展示

#### Scenario: GM 发放积分
- **GIVEN** 开发环境启用 GM 命令
- **WHEN** 执行 GM 发放积分
- **THEN** 积分余额增加
- **AND** 可用于解锁内容

### Requirement: 积分消费规则
系统 SHALL 使用积分解锁付费内容并记录消费。

#### Scenario: 积分消费优先级
- **GIVEN** 用户访问可解锁内容
- **WHEN** 同时存在免费额度或订阅额度
- **THEN** 先消耗免费/订阅额度
- **AND** 仅在额度用尽后消耗积分

#### Scenario: 积分解锁永久/周期内容
- **GIVEN** 用户选择使用积分解锁内容
- **WHEN** 积分余额足够
- **THEN** 扣减积分余额
- **AND** 写入购买记录（scope 与有效期匹配）
- **AND** 更新权益缓存

#### Scenario: 积分解锁消耗型内容
- **GIVEN** 用户 Ask 或使用 Synthetica
- **WHEN** 免费/订阅额度不足
- **THEN** 按单次价格扣减积分
- **AND** 返回最新剩余积分

#### Scenario: 报告必须使用积分购买
- **GIVEN** 用户购买任一报告
- **WHEN** 提交购买请求
- **THEN** 仅允许使用积分支付
- **AND** 订阅用户使用折扣积分价格

### Requirement: 权益校验
系统 MUST 在关键功能点进行权益校验。

#### Scenario: 校验功能可用性
- **GIVEN** 用户触发付费功能
- **WHEN** 后端收到校验请求
- **THEN** 检查订阅状态与积分余额
- **AND** 返回可访问与否及所需积分

#### Scenario: 显示付费墙
- **GIVEN** 用户权益不足
- **WHEN** 前端收到不可访问结果
- **THEN** 展示积分解锁入口
- **AND** 提供积分充值与订阅选项

### Requirement: 免费额度防滥用
系统 SHALL 追踪未登录用户的免费额度使用以防止滥用。

#### Scenario: 设备指纹追踪
- **GIVEN** 未登录用户首次访问
- **WHEN** 页面加载
- **THEN** 生成设备指纹
- **AND** 关联免费额度记录

#### Scenario: 跨设备限制
- **GIVEN** 用户在新设备访问
- **WHEN** 设备指纹不同
- **THEN** 获得新的免费额度
- **AND** IP 相同时限制新设备数量
