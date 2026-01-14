<!-- INPUT: 主应用计算与内容生成服务（后端驱动，含详情解锁、GM 积分购买与 API 地址默认值）。 -->
<!-- OUTPUT: services 架构摘要与文件索引（含详情解锁、GM 积分购买与 API 地址默认值更新）。 -->
<!-- POS: 主应用服务目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：services

架构概要
- 提供占星计算与内容生成的服务层。
- apiClient 调用后端 API 获取真实数据与 AI 内容（含合盘综述分区、技术附录拆分与 CBT 错误透传）。
- astroService 封装后端星盘与周期数据获取，并构建前端需要的衍生数据。
- geminiService 负责 prompt key 映射，统一从后端获取 AI 内容并返回单语言 content。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录服务目录架构与文件清单。
- apiClient.ts｜地位：API 客户端｜功能：调用后端 API 获取数据（含问答类别、Markdown 报告、AI 来源元数据与 CBT 错误透传）。
- paymentClient.ts｜地位：支付与权益客户端｜功能：订阅/购买/权益查询与 GM 测试指令调用。
- astroService.ts｜地位：星盘服务｜功能：封装星盘/周期数据获取与衍生计算（含宫主星推导）。
- geminiService.ts｜地位：内容服务｜功能：后端 AI 内容分发与映射。

子目录
- cbt/｜地位：CBT 服务子目录｜功能：CBT 功能的后端服务。

近期更新
- API 客户端默认在生产环境使用同源 `/api`，避免指向 localhost。
- entitlementClient V2 在积分购买时同步日次解锁本地缓存。
- entitlementClient V2 接入详情解锁与 GM 积分购买 API。
- paymentClient 新增 GM 开发会话与测试指令 API 调用。
- apiClient 新增 Wiki 经典书籍列表/详情 API 调用与本地缓存。
- apiClient 修复 Wiki 详情重复定义并补齐缓存版本常量。
- apiClient 增加 Wiki 首页的本地日缓存，避免重复刷新。
- astroService 新增宫主星与飞入宫位计算。
- astroService 补充宫主星飞入星座信息，用于宫主星表格展示。
- astroService 扩展行星/小行星/敏感点列表并补齐相位矩阵数据。
- apiClient 新增合盘技术附录独立端点与本地缓存，overview 不再携带附录。
- astroService 扩展行星列表与相位体覆盖 Desc/IC，并纳入北交点。
- astroService 支持合盘档案输入以计算 Big3。
- 合盘报告请求超时上调以减少误判失败。
- 合盘报告前端请求改为不设超时以持续等待结果。
- apiClient 支持合盘 tab 分段请求与单语言响应结构。
- apiClient 新增合盘综述分区端点以支持按需加载。
- apiClient 新增合盘报告/分区本地缓存以加速重复访问。
- apiClient 为 Highlights 分区增加旧接口兼容回退。
- apiClient 补充 CBT 分析错误解析，便于前端提示与重试。
- geminiService 改为直接读取单语言 content。
- 问答请求改为返回 Markdown 报告并按分类透传。
- apiClient 新增 Wiki 首页/条目/搜索 API 调用。
