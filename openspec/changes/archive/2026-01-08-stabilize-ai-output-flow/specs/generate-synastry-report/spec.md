<!-- INPUT: 合盘按需生成与单语言输出变更。 -->
<!-- OUTPUT: OpenSpec 合盘报告增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Report generation
系统 SHALL 通过后端基于 Swiss Ephemeris 计算合盘事实并生成报告内容，默认仅生成总览内容，并返回单语言字段供前端展示。

#### Scenario: Synastry report loads
- **WHEN** 用户提交有效伴侣资料并选择关系类型
- **THEN** 前端从后端获取合盘总览内容（单语言）并渲染

### Requirement: Tabbed perspectives
系统 SHALL 提供总览、双方本命、双向对比与组合盘的标签切换，并在空闲时按标签顺序预取未加载内容，用户切换时按需补全。

#### Scenario: User switches perspectives
- **WHEN** 用户切换到未加载的标签
- **THEN** 前端发起对应标签的请求并在返回后展示

#### Scenario: Prefetch runs after overview
- **WHEN** 总览内容加载完成且界面空闲
- **THEN** 系统按标签顺序预取其余标签内容并缓存结果

## ADDED Requirements
### Requirement: AI failure handling
系统 SHALL 在 AI 不可用时返回明确错误并展示失败状态，不得使用 mock 内容替代。

#### Scenario: AI unavailable is surfaced
- **WHEN** 合盘 AI 生成失败
- **THEN** 前端展示失败提示且不渲染 mock 报告
