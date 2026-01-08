# 权益管理

## ADDED Requirements

### Requirement: 免费权益
系统 SHALL 为未登录或免费用户提供基础免费权益。

#### Scenario: 本命盘免费查看
- Given 任何用户访问应用
- When 输入出生信息
- Then 可免费查看本命盘可视化
- And 可免费查看技术数据表格
- And 无次数限制

#### Scenario: Ask 免费试用
- Given 新用户首次使用 Ask
- When 提交问题
- Then 免费获得 3 次 Ask 额度
- And 显示剩余免费次数
- And 用完后显示付费墙

#### Scenario: 详情解读免费试用
- Given 新用户点击行星/相位详情
- When 请求 AI 解读
- Then 免费获得 3 次解读额度
- And 用完后显示付费墙

#### Scenario: 合盘免费预览
- Given 用户创建合盘
- When 查看合盘结果
- Then 可免费查看总览 Tab
- And 其他 Tab 显示付费墙

### Requirement: 订阅权益
系统 SHALL 为订阅用户提供完整权益包。

#### Scenario: 无限 Ask 问答
- Given 订阅用户提交 Ask 问题
- When 问题处理完成
- Then 不扣减任何额度
- And 无次数限制

#### Scenario: 无限详情解读
- Given 订阅用户点击详情解读
- When 解读生成完成
- Then 不扣减任何额度

#### Scenario: 合盘月度额度
- Given 订阅用户查看合盘
- When 访问任意 Tab
- Then 每月可使用 5 次完整合盘解读
- And 显示本月剩余次数
- And 次数用完可单独购买

#### Scenario: 月运报告权益
- Given 订阅用户在每月初
- When 访问报告页面
- Then 可免费领取当月月运报告
- And 每月限领 1 份

#### Scenario: 付费报告折扣
- Given 订阅用户购买年度报告
- When 查看价格
- Then 显示原价和 30% 折扣价
- And 以折扣价结算

### Requirement: 权益校验
系统 MUST 在关键功能点进行权益校验。

#### Scenario: 校验 Ask 权益
- Given 用户提交 Ask 问题
- When 后端收到请求
- Then 检查用户订阅状态
- And 检查剩余免费/购买额度
- And 无权益时返回 403 错误

#### Scenario: 显示付费墙
- Given 用户触发付费功能
- When 权益校验失败
- Then 前端显示付费墙组件
- And 显示单次购买价格
- And 显示订阅推荐
- And 提供购买/订阅按钮

#### Scenario: 消耗权益
- Given 用户有足够权益
- When AI 内容生成成功
- Then 扣减相应额度
- And 更新前端权益状态
- And 显示剩余额度

### Requirement: 免费额度防滥用
系统 SHALL 追踪未登录用户的免费额度使用以防止滥用。

#### Scenario: 设备指纹追踪
- Given 未登录用户首次访问
- When 页面加载
- Then 生成设备指纹
- And 关联免费额度记录

#### Scenario: 跨设备限制
- Given 用户在新设备访问
- When 设备指纹不同
- Then 获得新的免费额度
- And IP 相同时限制新设备数量
