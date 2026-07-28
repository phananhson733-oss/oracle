# 付费与订阅系统 - 设计文档

## 1. 定价策略

### 1.1 定价原则

- **目标市场**：欧美用户为主
- **策略**：低价获客 + 高频付费 + 性价比差异化
- **毛利目标**：保守型 80%+（成本 × 5）
- **参考竞品**：Co-Star（实惠路线）

### 1.2 AI Token 成本基准（DeepSeek API）

| 内容类型 | Token 消耗 | API 成本 | 最低定价（80%毛利）|
|---------|-----------|---------|-------------------|
| 元素/行星详情 | 500-800 | $0.002 | $0.01 → $0.99 |
| Ask 单次问答 | 1000-1500 | $0.004 | $0.02 → $1.99 |
| 合盘单 Tab | 2000-3000 | $0.008 | $0.04 → $2.99 |
| 完整合盘报告 | 8000-12000 | $0.03 | $0.15 → $3.99 |
| 月运报告 | 5000-8000 | $0.02 | $0.10 → $1.99 |
| 年度运势报告 | 15000-25000 | $0.06 | $0.30 → $7.99 |
| CBT 日记分析 | 1500-2500 | $0.006 | $0.03 → $1.99 |

---

## 2. 权益设计

### 2.1 首次注册赠送

**新用户首次注册**：
- 赠送 **7 天免费订阅体验**
- 体验期间享有完整订阅权益
- 到期后权益自动消失，需付费订阅续期

### 2.2 免费权益（Free Tier）

| 功能 | 免费额度 | 重置周期 | 说明 |
|-----|---------|---------|------|
| 本命盘可视化 | ✓ 无限 | - | 核心钩子，永久免费 |
| 技术数据表格 | ✓ 无限 | - | 行星/相位/宫位表格 |
| 日运摘要 | ✓ 简版 | - | 公开内容（4 维等） |
| 探索自我 - 心理维度前 2 个 | ✓ 免费 | - | Emotions, Attachment |
| Ask 问答 | 3 次 | 每周 | 周一 00:00 UTC 重置 |
| 双人合盘 | 3 次 | 永久 | 永久免费 3 次 |
| CBT 日记记录 | ✓ 无限 | - | 记录免费，分析付费 |

### 2.3 订阅权益（Subscriber）

**定价：$6.99/月**

| 权益 | 额度 | 说明 |
|-----|------|------|
| 所有"查看详情"按钮 | ✓ 无限 | 探索自我、今日运势、合盘等 |
| Ask 问答 | +2 次/周 | 与免费 3 次叠加，共 5 次/周 |
| 探索自我付费内容 | ✓ 全部解锁 | 心理维度后 4 个 + 核心主题 |
| 双人合盘 | +2 次/周 | 与免费 3 次叠加，显示为 5/5 |
| 今日运势详情 | ✓ 无限 | 今日剧本 + 星象详情 |
| CBT 日记统计解读 | ✓ 自动解锁 | 进入页面即解锁当月所有内容 |
| 订阅赠送积分 | +500 积分 | 每次成功支付后发放并展示在权益列表 |
| 付费报告 | **8 折（积分价格）** | 报告仅支持积分购买 |

**重置规则**：
- Ask 问答：每周一 00:00 UTC 重置
- 双人合盘：每周一 00:00 UTC 重置
- 权益次数与免费次数分开计算后合并显示
- 报告购买仅使用积分，订阅折扣应用到积分价格（向上取整）

### 2.4 积分消耗定价

**换算建议**：1 积分 = $0.10（与原单价对齐后取整）

| 功能 | 积分 | 有效期 | 说明 |
|-----|------|-------|------|
| 探索自我 - 心理维度单个 | 10 | 永久 | 按维度单独解锁 |
| 探索自我 - 核心主题单个 | 10 | 永久 | 按主题单独解锁 |
| 今日运势 - 今日剧本 | 10 | 当日 | 每日重置 |
| 今日运势 - 星象详情 | 10 | 当日 | 每日重置 |
| 双人合盘 - 单次 | 30 | 永久 | 该配对永久有效 |
| 合盘内 - 查看详情 | 10 | 永久 | 需唯一性校验 |
| Ask 问答 - 单次 | 20 | 单次 | 消耗后失效 |
| CBT 日记 - 月度统计解读 | 20 | 自然月 | 按自然月解锁 |

### 2.5 积分系统

- 积分通过充值套餐获得，余额可叠加并在前端展示。
- 所有付费功能统一走积分解锁，不再直接单次购买。
- 消费优先级：**免费额度 → 订阅权益 → 积分余额**。
- GM 命令可在开发环境发放/清零积分用于测试。

---

## 3. 唯一性校验设计

### 3.1 合盘唯一性

**问题**：防止用户通过微小修改信息来免费刷合盘次数

**解决方案**：基于双方完整信息生成唯一哈希

```typescript
interface SynastryIdentity {
  personA: {
    name: string;
    birthDate: string;       // YYYY-MM-DD
    birthTime?: string;      // HH:mm
    birthCity: string;
    lat: number;
    lon: number;
    timezone: string;
  };
  personB: {
    name: string;
    birthDate: string;
    birthTime?: string;
    birthCity: string;
    lat: number;
    lon: number;
    timezone: string;
  };
  relationshipType: string;
}

// 生成哈希
function generateSynastryHash(identity: SynastryIdentity): string {
  const normalized = JSON.stringify({
    a: normalizePersonInfo(identity.personA),
    b: normalizePersonInfo(identity.personB),
    rel: identity.relationshipType,
  });
  return sha256(normalized);
}

function normalizePersonInfo(person: PersonInfo) {
  return {
    name: person.name.trim().toLowerCase(),
    birthDate: person.birthDate,
    birthTime: person.birthTime || 'unknown',
    lat: Math.round(person.lat * 100) / 100,  // 保留 2 位小数
    lon: Math.round(person.lon * 100) / 100,
    timezone: person.timezone,
  };
}
```

**规则**：
- 任何字段（包括姓名）变化，哈希值改变，视为新的合盘
- 哈希值存储在 `synastry_records` 表
- 查询时先检查哈希是否存在

### 3.2 查看详情唯一性

**问题**：区分永久性解锁和一次性解锁

**解决方案**：

```typescript
// 购买记录类型
type PurchaseScope =
  | 'permanent'           // 永久解锁（探索自我）
  | 'daily'               // 每日重置（今日运势）
  | 'per_synastry'        // 按合盘配对（合盘内详情）
  | 'per_month'           // 按自然月（CBT 统计）
  | 'consumable';         // 消耗型（Ask）

interface PurchaseRecord {
  userId: string;
  featureType: string;        // 'dimension', 'daily_script', 'credit', etc.
  featureId?: string;         // 具体 ID（如维度名、合盘哈希、充值套餐 ID）
  scope: PurchaseScope;
  validUntil?: Date;          // 有效期（daily/monthly）
  quantity?: number;          // 购买的数量（含积分余额）
  consumed?: number;          // 已消耗数量（consumable）
}
```

**校验逻辑**：

```typescript
async function checkPurchase(
  userId: string,
  featureType: string,
  featureId?: string
): Promise<boolean> {
  const record = await db.purchaseRecords.findFirst({
    where: {
      userId,
      featureType,
      featureId: featureId || null,
    },
  });

  if (!record) return false;

  switch (record.scope) {
    case 'permanent':
      return true;
    case 'daily':
      return isSameDay(record.validUntil, new Date());
    case 'per_month':
      return isSameMonth(record.validUntil, new Date());
    case 'per_synastry':
      return true;  // featureId 是合盘哈希
    case 'consumable':
      return record.consumed < record.quantity;
  }
}
```

---

## 4. 缓存策略设计

### 4.1 前端缓存架构

```
┌─────────────────────────────────────────────────────────┐
│                    React Context                         │
├─────────────────────────────────────────────────────────┤
│  EntitlementContext   │   DataCacheContext              │
│  - 订阅状态           │   - 页面数据缓存                 │
│  - 购买记录           │   - 请求去重                     │
│  - 免费额度           │   - 失效策略                     │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                   localStorage                           │
├─────────────────────────────────────────────────────────┤
│  astro_entitlements   │   astro_cache_*                 │
│  - 权益状态快照       │   - 页面数据缓存                 │
│  - 更新时间戳         │   - 版本号                       │
└─────────────────────────────────────────────────────────┘
```

### 4.2 缓存 Key 设计

```typescript
const CACHE_KEYS = {
  // 权益相关
  ENTITLEMENTS: 'astro_entitlements',
  PURCHASE_RECORDS: 'astro_purchases',

  // 页面数据
  ME_PAGE: 'astro_cache_me',
  TODAY_PAGE: (date: string) => `astro_cache_today_${date}`,
  SYNASTRY: (hash: string) => `astro_cache_synastry_${hash}`,
  ASK_HISTORY: 'astro_cache_ask_history',
  CBT_STATS: (yearMonth: string) => `astro_cache_cbt_${yearMonth}`,
};
```

### 4.3 缓存策略

| 数据类型 | 缓存位置 | TTL | 失效条件 |
|---------|---------|-----|---------|
| 权益状态 | Memory + localStorage | 5 分钟 | 支付成功、订阅变更 |
| 探索自我数据 | Memory + localStorage | 永久 | 出生信息修改 |
| 今日运势数据 | Memory + localStorage | 当日 | 日期变更 |
| 合盘数据 | Memory + localStorage | 永久 | 配对信息变更 |
| Ask 历史 | Memory + localStorage | 永久 | - |
| CBT 统计 | Memory + localStorage | 当月 | 月份变更 |

### 4.4 缓存实现示例

```typescript
// 带缓存的数据获取 Hook
function useCachedData<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;           // 毫秒
    invalidateOn?: string[];  // 依赖变化时失效
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 检查缓存
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isValid = !options.ttl || Date.now() - timestamp < options.ttl;
      if (isValid) {
        setData(data);
        return;
      }
    }

    // 获取新数据
    setLoading(true);
    fetcher().then(result => {
      setData(result);
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now(),
      }));
    }).finally(() => setLoading(false));
  }, [cacheKey, ...options.invalidateOn || []]);

  return { data, loading };
}
```

---

## 5. 付费墙组件设计

### 5.1 锁标识 UI

```tsx
// 锁定状态的内容展示
interface LockedContentProps {
  title: string;
  description?: string;
  price: string;
  onUnlock: () => void;
}

function LockedContent({ title, description, price, onUnlock }: LockedContentProps) {
  return (
    <div className="relative">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
        <LockIcon className="w-8 h-8 text-amber-400 mb-2" />
        <span className="text-white font-medium">{title}</span>
        {description && (
          <span className="text-gray-400 text-sm mt-1">{description}</span>
        )}
        <button
          onClick={onUnlock}
          className="mt-4 px-4 py-2 bg-amber-500 text-black rounded-full font-medium"
        >
          解锁 {price}
        </button>
      </div>

      {/* 模糊的预览内容 */}
      <div className="blur-sm pointer-events-none">
        {/* 占位内容 */}
      </div>
    </div>
  );
}
```

### 5.2 付费弹窗设计

```tsx
interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  pointsCost: number;
  pointsBalance: number;
  onSpendPoints: () => void;
  onTopUp: () => void;
  onSubscribe: () => void;
}

function PaywallModal({
  isOpen,
  onClose,
  feature,
  pointsCost,
  pointsBalance,
  onSpendPoints,
  onTopUp,
  onSubscribe,
}: PaywallModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">解锁 {feature}</h2>

        {/* 选项 1：积分解锁 */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">使用积分解锁</h3>
              <p className="text-sm text-gray-400">当前余额 {pointsBalance} 积分</p>
            </div>
            <button
              onClick={onSpendPoints}
              className="px-4 py-2 bg-white text-black rounded-full"
            >
              消耗 {pointsCost} 积分
            </button>
          </div>
        </div>

        {/* 选项 2：购买积分 */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">购买积分</h3>
              <p className="text-sm text-gray-400">充值积分用于解锁内容</p>
            </div>
            <button
              onClick={onTopUp}
              className="px-4 py-2 bg-white text-black rounded-full"
            >
              选择套餐
            </button>
          </div>
        </div>

        {/* 选项 3：订阅（推荐） */}
        <div className="border-2 border-amber-500 rounded-lg p-4 relative">
          <span className="absolute -top-3 left-4 bg-amber-500 text-black text-xs px-2 py-1 rounded-full">
            推荐
          </span>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">开启订阅</h3>
              <p className="text-sm text-gray-400">解锁所有内容 + 更多权益</p>
            </div>
            <button
              onClick={onSubscribe}
              className="px-4 py-2 bg-amber-500 text-black rounded-full"
            >
              $6.99/月
            </button>
          </div>
        </div>

        {/* 订阅权益列表 */}
        <div className="mt-4 text-sm text-gray-400">
          <p>订阅包含：</p>
          <ul className="list-disc list-inside mt-2">
            <li>所有查看详情免费</li>
            <li>每周 5 次 Ask 问答</li>
            <li>每周 5 次合盘</li>
            <li>报告 8 折优惠</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
```

### 5.3 积分余额与使用情况展示

- 顶部导航/侧边栏显示积分胶囊（星标图标 + 数值，参考 Image #2）。
- 点击积分入口进入「使用情况」页面或抽屉，布局参考 Image #1。
- 页面顶部显示当前方案（免费/订阅）与「升级」按钮。
- 概览卡片包含：积分余额、订阅赠送积分（500，含下次扣费/发放时间）、本周免费额度（Ask/合盘/Synthetica）。
- 使用记录列表：列展示「详情 / 日期 / 积分变更」，正负数高亮（+ 绿色，- 红色）。
- 付费墙内显示「余额/本次消耗/差额」，不足时优先引导充值套餐。

---

## 6. 数据库设计

### 6.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar TEXT,
  provider VARCHAR(20) NOT NULL,
  provider_id VARCHAR(255),
  password_hash VARCHAR(255),

  birth_profile JSONB,
  preferences JSONB DEFAULT '{"theme": "dark", "language": "en"}',

  -- 首次注册 7 天试用
  trial_ends_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订阅表
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),

  plan VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 购买记录表（新增）
CREATE TABLE purchase_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  feature_type VARCHAR(100) NOT NULL,   -- 'dimension', 'daily_script', 'credit', etc.
  feature_id VARCHAR(255),              -- 具体 ID（维度名、合盘哈希、充值套餐等）
  scope VARCHAR(20) NOT NULL,           -- 'permanent', 'daily', 'per_synastry', 'per_month', 'consumable'

  price_cents INTEGER NOT NULL,
  stripe_payment_intent_id VARCHAR(255),

  valid_until TIMESTAMPTZ,              -- 有效期
  quantity INTEGER DEFAULT 1,           -- 消耗型数量（积分充值为积分数）
  consumed INTEGER DEFAULT 0,           -- 已消耗

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 合盘记录表（新增）
CREATE TABLE synastry_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  synastry_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA256 哈希
  person_a_info JSONB NOT NULL,
  person_b_info JSONB NOT NULL,
  relationship_type VARCHAR(50),

  is_free BOOLEAN DEFAULT FALSE,              -- 是否使用免费次数

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 免费额度表
CREATE TABLE free_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255),

  -- Ask 问答（每周重置）
  ask_used INTEGER DEFAULT 0,
  ask_reset_at TIMESTAMPTZ,

  -- 合盘（永久）
  synastry_used INTEGER DEFAULT 0,

  -- 其他...

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订阅权益使用表（每周重置）
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  week_start DATE NOT NULL,           -- 周起始日期

  ask_used INTEGER DEFAULT 0,         -- 本周 Ask 权益使用
  synastry_used INTEGER DEFAULT 0,    -- 本周合盘权益使用

  UNIQUE(user_id, week_start)
);
```

### 6.2 索引

```sql
CREATE INDEX idx_purchase_records_user_feature ON purchase_records(user_id, feature_type, feature_id);
CREATE INDEX idx_synastry_records_hash ON synastry_records(synastry_hash);
CREATE INDEX idx_free_usage_user ON free_usage(user_id);
CREATE INDEX idx_subscription_usage_user_week ON subscription_usage(user_id, week_start);
```

---

## 7. API 设计

### 7.1 权益 API

```
GET  /api/entitlements
返回用户完整权益状态：
{
  isSubscriber: boolean,
  trialEndsAt: string | null,
  subscription: {
    plan: string,
    status: string,
    currentPeriodEnd: string,
  } | null,

  // 免费额度
  freeUsage: {
    askLeft: number,          // 本周剩余
    askResetAt: string,
    synastryLeft: number,     // 永久剩余
  },

  // 订阅权益额度（如有）
  subscriptionUsage: {
    askLeft: number,          // 本周订阅权益剩余
    synastryLeft: number,
  },

  // 已购买的永久内容
  purchasedFeatures: string[],

  // 积分余额
  credits: {
    balance: number,
    subscriptionBonus: number,
    nextGrantAt?: string,
  },
}

POST /api/entitlements/check
检查特定功能是否可用：
Request:
{
  featureType: string,
  featureId?: string,
}
Response:
{
  canAccess: boolean,
  reason?: 'subscribed' | 'purchased' | 'free_quota' | 'trial',
  needPurchase?: boolean,
  price?: number, // 积分价格
}

POST /api/entitlements/consume
消耗权益（Ask 等消耗型 / 积分）：
Request:
{
  featureType: string,
  source: 'free' | 'subscription' | 'credits',
}
Response:
{
  success: boolean,
  remaining: number,
}
```

### 7.2 积分充值/消费 API

```
POST /api/payment/credits/create-checkout
创建积分充值会话：
Request:
{
  packageId: string,
  method: 'stripe' | 'paypal' | 'card',
  successUrl: string,
  cancelUrl: string,
}
Response:
{
  checkoutUrl: string,
}

POST /api/payment/credits/webhook
Stripe Webhook 处理

POST /api/payment/credits/spend
使用积分解锁内容：
Request:
{
  featureType: string,
  featureId?: string,
}
Response:
{
  success: boolean,
  creditsBalance: number,
}

GET /api/payment/credits/records
获取积分充值/消费记录
```

### 7.3 合盘 API

```
POST /api/synastry/check-hash
检查合盘是否已存在：
Request:
{
  personA: PersonInfo,
  personB: PersonInfo,
  relationshipType: string,
}
Response:
{
  exists: boolean,
  hash: string,
  canAccessFree: boolean,
  freeLeft: number,
}

POST /api/synastry/record
记录合盘使用：
Request:
{
  hash: string,
  isFree: boolean,
}
```

### 7.4 支付方式支持

- 支持 Stripe 与 PayPal 两条支付通道。
- 信用卡支付默认通过 Stripe 处理。
- 前端在充值/订阅时提供支付方式选择入口。

---

## 8. 前端页面集成

### 8.1 探索自我 (MePage)

```tsx
function DimensionContent({ dimension, index }) {
  const { canAccess, purchase } = useFeatureAccess(
    'dimension',
    dimension.id
  );

  // 前 2 个免费
  if (index < 2 || canAccess) {
    return <DimensionDetail dimension={dimension} />;
  }

  return (
    <LockedContent
      title={dimension.name}
      price="10 积分"
      onUnlock={() => purchase()}
    />
  );
}
```

### 8.2 今日运势 (TodayPage)

```tsx
function TodayDetail() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { canAccess, purchase } = useFeatureAccess(
    'daily_script',
    today
  );

  if (!canAccess) {
    return (
      <LockedContent
        title="今日剧本"
        description="每日重置"
        price="10 积分"
        onUnlock={() => purchase()}
      />
    );
  }

  return <DailyScript />;
}
```

### 8.3 双人合盘 (UsPage)

```tsx
function SynastryPage() {
  const [personA, personB, relationshipType] = useSynastryInput();
  const {
    canAccessFree,
    freeLeft,
    subscriptionLeft,
    hash
  } = useSynastryAccess(personA, personB, relationshipType);

  const handleGenerate = async () => {
    if (canAccessFree) {
      // 使用免费/订阅次数
      await recordSynastryUsage(hash, true);
    } else {
      // 需要付费
      await purchase('synastry', hash);
    }
  };

  return (
    <div>
      {/* 显示剩余次数 */}
      <div>
        合盘次数: {freeLeft + subscriptionLeft} / {3 + (isSubscriber ? 2 : 0)}
      </div>

      <button onClick={handleGenerate}>
        {canAccessFree ? '生成合盘' : `消耗 30 积分生成`}
      </button>
    </div>
  );
}
```

### 8.4 Ask 问答 (AskOraclePage)

```tsx
function AskPage() {
  const { askLeft, subscriptionAskLeft, purchase } = useAskQuota();
  const totalLeft = askLeft + subscriptionAskLeft;

  const handleAsk = async (question: string) => {
    if (totalLeft > 0) {
      // 优先使用免费额度
      const source = askLeft > 0 ? 'free' : 'subscription';
      await consumeAsk(source);
      await submitQuestion(question);
    } else {
      // 需要付费
      await purchase('ask_single');
    }
  };

  return (
    <div>
      <div>本周剩余: {totalLeft} 次</div>
      <button onClick={() => handleAsk(question)}>
        {totalLeft > 0 ? '提问' : '消耗 20 积分提问'}
      </button>
    </div>
  );
}
```

### 8.5 CBT 日记统计 (CalendarStats)

```tsx
function CBTStats() {
  const yearMonth = format(new Date(), 'yyyy-MM');
  const { isSubscriber, canAccess, purchase } = useFeatureAccess(
    'cbt_stats',
    yearMonth
  );

  // 订阅用户自动解锁
  useEffect(() => {
    if (isSubscriber && !canAccess) {
      autoUnlock('cbt_stats', yearMonth);
    }
  }, [isSubscriber]);

  if (!canAccess) {
    return (
      <LockedContent
        title="本月统计解读"
        price="20 积分/月"
        onUnlock={() => purchase()}
      />
    );
  }

  return <StatsContent />;
}
```

---

## 9. 安全考虑

### 9.1 防滥用

- 设备指纹追踪免费额度
- IP 限流
- 注册需邮箱验证
- 合盘唯一性哈希校验

### 9.2 支付安全

- Stripe Webhook 签名验证
- 服务端验证订阅状态
- 关键操作记录审计日志

### 9.3 数据安全

- 密码使用 bcrypt 加盐哈希
- JWT Token 短期有效 + Refresh Token
- 敏感数据加密存储
