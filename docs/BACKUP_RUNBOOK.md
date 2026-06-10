<!-- INPUT: oracle 的数据存储拓扑（Supabase Postgres / Redis / Vercel）+ backend/migrations/*.sql 的真实 schema。 -->
<!-- OUTPUT: 备份 / 恢复 runbook——数据清单、备份机制、RPO/RTO 目标、可复制恢复步骤、演练清单、待核验 TODO。 -->
<!-- POS: backlog #21 产出。平台层事实（Supabase 套餐 PITR / 保留窗口）仓内不可验，标 UNVERIFIED，须经 dashboard 核实后回填。 -->

# 备份与恢复 Runbook（Backup & Restore Runbook）

> 生成日期：2026-06-03 · 来源：backlog #21 `obs-backup-restore-runbook`
> ⚠ 本文档区分 **已验证（读代码/migrations）** 与 **UNVERIFIED（须 Supabase/Vercel dashboard 核实）**。
> 任何标 `UNVERIFIED` 的平台声明在核实前不得作为可靠性保证。

---

## 1. 数据存储拓扑（已验证 — 读代码）

| 存储 | 用途 | 持久性 | 是否需备份 | 配置来源 |
|---|---|---|---|---|
| **Supabase Postgres** | 唯一持久数据源（账号 / 订阅 / 支付 / 报告） | 持久 | ✅ **主备份对象** | `backend/src/db/supabase.ts`（`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`） |
| **Redis** | 缓存层（星历 / AI 结果 / 配额计数；含内存兜底） | 易失（可重算） | ❌ 不备份（见 §5.3） | `backend/src/cache/redis.ts`（`REDIS_URL`） |
| **Vercel** | 无状态 serverless 部署 + 静态资源 | 无状态（从 git 重建） | ❌ 代码即 git，无独立数据 | `vercel.json` |

### 1.1 Postgres 表清单（已验证 — `backend/migrations/000-007`）

`users`、`subscriptions`、`subscription_usage`、`purchases`、`purchase_records`、`reports`、`free_usage`、`synastry_records`、`trial_claims`、`registration_codes`、`newsletter_subscribers`、`webhook_events`（共 12 张）。

**高敏感（PII / 计费，恢复优先级最高）**：`users`（邮箱 / 鉴权标识 / 出生数据）、`newsletter_subscribers`（邮箱）、`subscriptions` + `purchases` + `purchase_records`（计费状态）、`webhook_events`（支付幂等去重，丢失可致重复处理）。

---

## 2. 备份机制

### 2.1 Schema 即代码（已验证）
全量 schema 由 `backend/migrations/000_initial_schema.sql … 007_newsletter_subscribers.sql` 定义并入 git。**结构永远可从 migrations 重建**，与数据备份解耦。新表/变更必须新增 migration 文件（禁止仅在 dashboard 手改 schema，否则恢复时漂移）。

### 2.2 Supabase 托管备份（UNVERIFIED — 须 dashboard 核实）
Supabase 按套餐提供每日备份与 PITR（Point-In-Time Recovery）：
- **UNVERIFIED-1**：当前项目所在套餐是否启用 **PITR**？保留窗口多少天？
- **UNVERIFIED-2**：每日备份的实际**保留天数**与所在区域？
- **UNVERIFIED-3**：备份是否覆盖全部 12 张表 + RLS 策略 + 序列/函数？

> 在 §7 的 TODO 核实前，**不要假设 PITR 已开启**。若套餐不含 PITR，§2.3 的离线 dump 是 RPO 的唯一保障。

### 2.3 离线逻辑 dump（推荐 — 纵深防御，当前 UNVERIFIED 是否已配置）
独立于平台的定期 `pg_dump` 落冷存储，作为「平台账号被锁 / 区域故障 / 误删整库」兜底：
```bash
# 只读连接串从 Supabase dashboard 取（service role，勿入 git / 日志）
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges -Fc -f "oracle-$(date -u +%Y%m%dT%H%M%SZ).dump"
# 上传至 offsite 对象存储（保留 ≥ 30 天，加密 at-rest）
```
**UNVERIFIED-4**：是否已有定时任务执行该 dump？落点 / 加密 / 保留期为何？

---

## 3. RPO / RTO 目标（**待 owner 签字** — 提议值）

| 指标 | 提议目标 | 依据 |
|---|---|---|
| **RPO**（最大可接受数据丢失） | PITR 开启时 ≤ 5 min；仅每日备份时 ≤ 24 h | 计费/账号写入频率中等，24h 丢失会影响订阅状态对账 |
| **RTO**（最大可接受恢复时长） | ≤ 4 h | 单区域托管库 + schema 即代码，全量恢复可控 |

> 这两个值**必须由 owner 结合套餐能力签字确认**后回填，并据此决定是否必须开 PITR / 配离线 dump。

---

## 4. 故障分类 → 恢复决策

| 场景 | 走哪条恢复路径 |
|---|---|
| 误删/误改部分行（单表数据损坏） | §5.1 PITR 到事故前时间点（优先）或从最近备份选择性恢复 |
| 整库损坏 / 区域故障 | §5.1 全量恢复到新实例 + §5.2 校验 schema |
| 平台账号不可用 / 需迁出 | §5.2 从 migrations 重建 schema + §2.3 离线 dump 灌数据 |
| 应用层故障（坏部署） | §5.4 Vercel 回滚（与数据无关） |
| 缓存异常 | §5.3 清 Redis，自动从 Postgres 回填 |

---

## 5. 恢复步骤

### 5.1 全量 / 时间点恢复（Supabase）
1. **冻结写入**：在 Vercel 临时下线写路径或置维护页，避免恢复期间脏写（**UNVERIFIED-5**：是否有维护开关？无则列入 §7 TODO）。
2. Supabase dashboard → Database → Backups → 选目标备份或 PITR 时间戳 → Restore。
3. 恢复完成后跑 §6 校验清单。
4. 恢复 `webhook_events` 后，确认支付 webhook 幂等键完整，避免重复入账。

### 5.2 Schema 重建（迁库 / 全新实例）
```bash
# 对新建空库按序执行 migrations（顺序即文件名前缀）
for f in backend/migrations/0*.sql; do psql "$TARGET_DB_URL" -f "$f"; done
# 再用 §2.3 的 dump 灌数据：pg_restore --no-owner -d "$TARGET_DB_URL" oracle-*.dump
```
> 务必核对 migrations 全部成功（RLS 策略 / 索引 / 序列）。重建后 `SUPABASE_URL` / service key 需在 Vercel env 同步更新。

### 5.3 Redis（无需恢复）
Redis 是**纯缓存**：星历 / AI 结果 / 配额计数均可从 Postgres 重算或重新生成；`redis.ts` 连接失败时自动走内存兜底。恢复动作 = 清空并让其自然回填，**不做数据恢复**。
> 注意：CBT 服务端数据按设计是 cache-backed（`CBT_RETENTION_TTL = 90d`），属**有意的非持久**；它不在备份范围，用户侧持久副本在客户端 localStorage。

### 5.4 应用回滚（Vercel）
坏部署与数据无关：Vercel dashboard → Deployments → 选上一个正常 production 部署 → Promote。代码全在 git，无需「恢复」应用数据。

---

## 6. 恢复后校验清单
- [ ] 12 张表全部存在且行数量级合理（对比事故前监控/估计）
- [ ] `users` 可登录（抽样验证鉴权）
- [ ] `subscriptions` / `purchases` 计费状态与支付商对账一致
- [ ] `webhook_events` 幂等键无缺失（防重复入账）
- [ ] RLS 策略生效（非 service-role 客户端越权读返回空）
- [ ] 应用端 `/api/*` 健康（natal / auth / 计费抽样 200）

---

## 7. 待核验 TODO（owner + deadline — 不得静默遗留）

> 以下每条在完成前，本 runbook 对应章节的可靠性**仅为提议，非保证**。

- [ ] **核实 Supabase 套餐 PITR / 每日备份 / 保留窗口**（UNVERIFIED-1/2/3）— Owner: `@platform-owner（待指派）` · Deadline: **2026-06-17**
- [ ] **确认/配置离线 `pg_dump` 定时任务 + 加密冷存 + 保留期**（UNVERIFIED-4）— Owner: `@platform-owner（待指派）` · Deadline: **2026-06-24**
- [ ] **owner 签字 RPO/RTO 目标**（§3）并据此决定是否强制开 PITR — Owner: `@product/ops（待指派）` · Deadline: **2026-06-17**
- [ ] **在 staging 跑一次完整恢复演练**，把结果（耗时 / 问题）回填到本文档 §8 — Owner: `@platform-owner（待指派）` · Deadline: **2026-06-30**
- [ ] **确认是否有写入冻结/维护开关**（UNVERIFIED-5），无则设计一个 — Owner: `@eng（待指派）` · Deadline: **2026-06-24**

---

## 8. 恢复演练记录

| 日期 | 类型 | 耗时（实际 RTO） | 数据丢失（实际 RPO） | 问题 / 改进 |
|---|---|---|---|---|
| _（尚未演练 — 见 §7 TODO）_ | | | | |

> ⚠ 在至少完成一次 staging 演练前，§3 的 RTO/RPO 是纸面估计，不构成 SLA。
