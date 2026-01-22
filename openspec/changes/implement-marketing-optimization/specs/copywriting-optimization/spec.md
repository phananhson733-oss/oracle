# 能力规范：文案优化

## ADDED Requirements

### Requirement: 重写首页核心文案
系统 SHALL 重写首页的主标题、副标题和核心描述，使其更清晰、更吸引人，符合 5 秒清晰度测试。

#### Scenario: 主标题传达核心价值
- **WHEN** 用户访问首页并阅读主标题
- **THEN** 标题应在 10 个字内说明产品核心价值
- **AND** 标题应使用用户语言（而非行业术语）
- **AND** 标题应具体且易懂

### Requirement: 优化产品功能描述
系统 SHALL 将功能描述从功能导向转为利益导向，强调用户能获得什么。

#### Scenario: 功能描述强调利益
- **WHEN** 用户查看功能列表
- **THEN** 每个功能应说明用户能获得什么
- **AND** 应避免技术术语
- **AND** 应使用具体的场景和例子

### Requirement: 改进 CTA 文案
系统 SHALL 重写所有 CTA 按钮文案，使其更具行动性和吸引力，说明点击后的结果。

#### Scenario: CTA 文案说明结果
- **WHEN** 用户看到 CTA 按钮
- **THEN** 文案应说明点击后会发生什么
- **AND** 应使用动词开头
- **AND** 应避免使用"提交"、"确定"等通用词

### Requirement: 创建文案风格指南
系统 SHALL 建立统一的文案风格指南以保持一致性，包括品牌语调、文案模板和术语表。

#### Scenario: 定义品牌语调
- **WHEN** 团队编写文案并参考风格指南
- **THEN** 应明确品牌语调（如友好、专业、启发性）
- **AND** 应提供语调示例和反例

## MODIFIED Requirements

### Requirement: 更新 constants.ts 中的文案
系统 SHALL 更新 `constants.ts` 中的所有文案以符合新的风格指南。

#### Scenario: 文案符合风格指南
- **WHEN** 开发者查看 constants.ts
- **THEN** 所有文案应符合风格指南
- **AND** 应使用一致的语调
- **AND** 应完整提供中英文版本

## REMOVED Requirements

无
