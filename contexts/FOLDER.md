<!-- INPUT: 认证/权益上下文实现与状态管理说明（含积分解锁、合盘付费回调与 Synthetica 日额度支持）。 -->
<!-- OUTPUT: contexts 目录架构摘要与文件索引（含合盘购买后续与额度 Hook 记录）。 -->
<!-- POS: contexts 目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：contexts

架构概要
- 提供认证状态、用户信息与权限弹窗的共享上下文。
- 维护权益状态与付费能力检查的上下文接口。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 contexts 目录架构与文件清单。
- AuthContext.tsx｜地位：认证上下文｜功能：管理登录状态、用户信息与权益刷新。
- EntitlementContext.tsx｜地位：权益上下文｜功能：提供权益检查、消耗与购买流程状态。

近期更新
- AuthContext/EntitlementContext 接入分析事件与用户属性更新（登录、注册、购买、付费墙曝光）。
- EntitlementContext 改为积分解锁流程，统一 Ask/Synthetica 余额判断与价格常量。
- EntitlementContext 新增 Synthetica 日额度消耗 Hook。
- AuthContext 接入权益刷新与缓存，供 GM 与支付流程复用。
- EntitlementContext 支持合盘购买回调并补充已购合盘校验。
- AuthContext 迁移偏好读取键 astro_theme→astro_theme_v2，默认 light（编辑部换装）。
