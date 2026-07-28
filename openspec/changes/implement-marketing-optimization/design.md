# 设计文档：营销优化架构

## 概述

本文档描述实施全面营销优化的架构决策、技术方案和实施细节。

## 1. 分析追踪架构

### 1.1 技术选型

**选择：Google Analytics 4 + Google Tag Manager**

**理由：**
- GA4 是行业标准，免费且功能强大
- GTM 提供灵活的标签管理，无需频繁修改代码
- 与 Google Search Console 无缝集成
- 支持事件驱动的追踪模型
- 有丰富的社区资源和文档

**替代方案考虑：**
- Mixpanel/Amplitude：更强大但成本高，当前阶段不需要
- Plausible/Fathom：隐私友好但功能有限
- 自建方案：开发成本高，维护复杂

### 1.2 数据层架构

**dataLayer 结构：**

```typescript
// types/analytics.ts
interface DataLayerEvent {
  event: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  userId?: string;
  userType?: 'free' | 'trial' | 'paid';
  [key: string]: any;
}

// 全局 dataLayer
declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
  }
}
```

**事件命名规范：**
- 格式：`object_action`（如 `signup_completed`, `cta_clicked`）
- 小写，使用下划线分隔
- 动词使用过去时（表示已完成）
- 保持一致性和可预测性

**事件分类：**
1. **页面事件**：`page_view`, `page_scroll`
2. **用户事件**：`signup_completed`, `login`, `logout`
3. **转化事件**：`purchase`, `subscription_started`, `trial_started`
4. **功能事件**：`oracle_question_asked`, `chart_generated`
5. **交互事件**：`cta_clicked`, `form_started`, `form_submitted`

### 1.3 追踪服务封装

**创建统一的追踪服务：**

```typescript
// services/analytics.ts
class AnalyticsService {
  // 初始化
  static init() {
    // 加载 GTM
    // 设置默认配置
  }

  // 追踪页面浏览
  static trackPageView(path: string, title: string) {
    window.dataLayer.push({
      event: 'page_view',
      page_path: path,
      page_title: title,
    });
  }

  // 追踪事件
  static trackEvent(eventName: string, params?: Record<string, any>) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }

  // 追踪转化
  static trackConversion(conversionName: string, value?: number) {
    window.dataLayer.push({
      event: 'conversion',
      conversion_name: conversionName,
      conversion_value: value,
    });
  }

  // 设置用户属性
  static setUserProperties(properties: Record<string, any>) {
    window.dataLayer.push({
      event: 'set_user_properties',
      ...properties,
    });
  }
}
```

**集成到现有代码：**
- 在 `index.tsx` 中初始化
- 在路由变化时追踪页面浏览
- 在关键操作时调用追踪方法

### 1.4 隐私合规

**GDPR/CCPA 考虑：**
- 实施 Cookie 同意横幅
- 提供退出追踪选项
- 匿名化 IP 地址
- 数据保留期限设置（14 个月）
- 隐私政策更新

**实施方案：**
```typescript
// services/consent.ts
class ConsentService {
  static hasConsent(): boolean {
    return localStorage.getItem('analytics_consent') === 'true';
  }

  static grantConsent() {
    localStorage.setItem('analytics_consent', 'true');
    AnalyticsService.init();
  }

  static revokeConsent() {
    localStorage.setItem('analytics_consent', 'false');
    // 禁用追踪
  }
}
```

---

## 2. SEO 架构

### 2.1 结构化数据实施

**Schema.org 类型选择：**

1. **Article Schema**（Wiki 文章）
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "文章标题",
  "author": {
    "@type": "Organization",
    "name": "AstrologyWiki"
  },
  "datePublished": "2024-01-01",
  "dateModified": "2024-01-15",
  "image": "https://...",
  "articleBody": "..."
}
```

2. **BreadcrumbList Schema**（面包屑）
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://..."
    }
  ]
}
```

3. **FAQPage Schema**（常见问题）
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "问题",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "答案"
      }
    }
  ]
}
```

**实施方式：**
- 扩展 `components/SEO.tsx` 组件
- 添加 `schema` prop 支持多种类型
- 在页面组件中传入相应的 schema 数据

### 2.2 程序化 SEO 架构

**页面生成策略：**

```typescript
// scripts/generate-seo-pages.mjs
interface SEOPageTemplate {
  urlPattern: string;
  titleTemplate: string;
  descriptionTemplate: string;
  contentTemplate: string;
}

// 数据源
const planets = ['Sun', 'Moon', 'Mercury', ...];
const signs = ['Aries', 'Taurus', 'Gemini', ...];
const houses = [1, 2, 3, ..., 12];

// 生成页面
function generatePages() {
  // 行星在星座：Sun in Aries, Moon in Taurus, etc.
  for (const planet of planets) {
    for (const sign of signs) {
      generatePage({
        url: `/wiki/${planet.toLowerCase()}-in-${sign.toLowerCase()}`,
        title: `${planet} in ${sign}: Meaning & Interpretation`,
        description: `Discover what ${planet} in ${sign} means...`,
        content: generateContent(planet, sign),
      });
    }
  }

  // 行星在宫位：Sun in 1st House, etc.
  // 相位：Sun conjunct Moon, etc.
}
```

**内容质量保证：**
- 使用 AI 生成初始内容（DeepSeek API）
- 人工审核和编辑
- 确保每个页面有独特价值
- 避免重复内容

**URL 结构：**
- `/wiki/[planet]-in-[sign]`
- `/wiki/[planet]-in-house-[number]`
- `/wiki/[planet]-[aspect]-[planet]`
- 使用小写和连字符
- 保持简洁和可读性

### 2.3 内部链接策略

**链接矩阵：**
- Wiki 文章 → 相关术语页面
- 术语页面 → 深度文章
- 经典著作 → 相关概念
- 主题聚类（Topic Clusters）

**实施方式：**
```typescript
// components/wiki/RelatedArticles.tsx
interface RelatedArticle {
  title: string;
  url: string;
  excerpt: string;
}

function RelatedArticles({ currentArticle }: Props) {
  const related = getRelatedArticles(currentArticle);

  return (
    <div className="related-articles">
      <h3>相关文章</h3>
      {related.map(article => (
        <ArticleCard key={article.url} {...article} />
      ))}
    </div>
  );
}
```

**链接算法：**
- 基于标签/分类的相关性
- 基于内容相似度
- 手动策划的推荐

### 2.4 性能优化

**Core Web Vitals 优化策略：**

1. **LCP 优化**（< 2.5s）
   - 图片懒加载和优化
   - 关键 CSS 内联
   - 预加载关键资源
   - CDN 加速

2. **INP 优化**（< 200ms）
   - 减少 JavaScript 执行时间
   - 代码分割
   - 使用 Web Workers
   - 优化事件处理

3. **CLS 优化**（< 0.1）
   - 为图片设置尺寸
   - 避免动态插入内容
   - 使用 CSS transform
   - 字体加载优化

**实施方案：**
```typescript
// services/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  AnalyticsService.trackEvent('web_vitals', {
    metric_name: metric.name,
    metric_value: metric.value,
    metric_id: metric.id,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## 3. 转化优化架构

### 3.1 A/B 测试框架

**技术选型：**
- 使用 GTM + GA4 进行简单 A/B 测试
- 或集成专业工具（Google Optimize 已停用，考虑 VWO/Optimizely）

**自建轻量级方案：**

```typescript
// services/abTest.ts
class ABTestService {
  private static experiments: Map<string, Experiment> = new Map();

  static defineExperiment(config: ExperimentConfig) {
    this.experiments.set(config.id, {
      ...config,
      variant: this.assignVariant(config),
    });
  }

  static getVariant(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return 'control';

    // 从 localStorage 获取已分配的变体
    const stored = localStorage.getItem(`ab_${experimentId}`);
    if (stored) return stored;

    // 分配新变体
    const variant = this.assignVariant(experiment);
    localStorage.setItem(`ab_${experimentId}`, variant);

    // 追踪分配
    AnalyticsService.trackEvent('ab_test_assigned', {
      experiment_id: experimentId,
      variant: variant,
    });

    return variant;
  }

  private static assignVariant(experiment: Experiment): string {
    const random = Math.random();
    let cumulative = 0;

    for (const [variant, weight] of Object.entries(experiment.weights)) {
      cumulative += weight;
      if (random < cumulative) return variant;
    }

    return 'control';
  }
}

// 使用示例
ABTestService.defineExperiment({
  id: 'paywall_headline',
  variants: ['control', 'variant_a', 'variant_b'],
  weights: { control: 0.33, variant_a: 0.33, variant_b: 0.34 },
});

const variant = ABTestService.getVariant('paywall_headline');
```

### 3.2 付费墙架构改进

**当前问题：**
- 付费墙逻辑分散在多个组件
- 触发逻辑不够灵活
- 难以进行 A/B 测试

**改进方案：**

```typescript
// services/paywallService.ts
interface PaywallConfig {
  feature: string;
  trigger: PaywallTrigger;
  content: PaywallContent;
  tracking: PaywallTracking;
}

interface PaywallTrigger {
  type: 'feature_gate' | 'usage_limit' | 'time_based' | 'behavior_based';
  condition: () => boolean;
  frequency: FrequencyConfig;
}

class PaywallService {
  static shouldShow(feature: string): boolean {
    const config = this.getConfig(feature);

    // 检查触发条件
    if (!config.trigger.condition()) return false;

    // 检查频率限制
    if (!this.checkFrequency(feature, config.trigger.frequency)) {
      return false;
    }

    // 检查用户权益
    if (this.hasAccess(feature)) return false;

    return true;
  }

  static show(feature: string) {
    const config = this.getConfig(feature);

    // 追踪展示
    AnalyticsService.trackEvent('paywall_shown', {
      feature: feature,
      trigger_type: config.trigger.type,
    });

    // 记录展示时间
    this.recordImpression(feature);

    // 返回付费墙内容
    return config.content;
  }

  static trackConversion(feature: string) {
    AnalyticsService.trackEvent('paywall_conversion', {
      feature: feature,
    });
  }
}
```

**付费墙内容组件化：**

```typescript
// components/auth/PaywallModal.tsx
interface PaywallModalProps {
  feature: string;
  variant?: string; // A/B 测试变体
  onUpgrade: () => void;
  onDismiss: () => void;
}

function PaywallModal({ feature, variant, onUpgrade, onDismiss }: PaywallModalProps) {
  const content = PaywallService.getContent(feature, variant);

  return (
    <Modal>
      <PaywallHeadline>{content.headline}</PaywallHeadline>
      <PaywallDescription>{content.description}</PaywallDescription>
      <PaywallFeatures features={content.features} />
      <PaywallSocialProof proof={content.socialProof} />
      <PaywallCTA onClick={onUpgrade}>{content.ctaText}</PaywallCTA>
      <PaywallDismiss onClick={onDismiss}>{content.dismissText}</PaywallDismiss>
    </Modal>
  );
}
```

### 3.3 表单优化架构

**渐进式表单组件：**

```typescript
// components/forms/ProgressiveForm.tsx
interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
  validation: ValidationSchema;
}

function ProgressiveForm({ steps, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  const handleNext = async () => {
    // 验证当前步骤
    const isValid = await validateStep(steps[currentStep], formData);
    if (!isValid) return;

    // 追踪步骤完成
    AnalyticsService.trackEvent('form_step_completed', {
      form_name: 'signup',
      step_number: currentStep + 1,
      step_name: steps[currentStep].id,
    });

    // 保存进度
    saveProgress(formData);

    // 下一步或完成
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  return (
    <div>
      <ProgressIndicator current={currentStep} total={steps.length} />
      <FormStepContent step={steps[currentStep]} data={formData} onChange={setFormData} />
      <FormNavigation onNext={handleNext} onBack={() => setCurrentStep(currentStep - 1)} />
    </div>
  );
}
```

**表单追踪：**
```typescript
// 追踪表单交互
function trackFormInteraction(formName: string, fieldName: string, action: string) {
  AnalyticsService.trackEvent('form_interaction', {
    form_name: formName,
    field_name: fieldName,
    action: action, // 'focus', 'blur', 'error', 'submit'
  });
}
```

---

## 4. 数据流架构

### 4.1 整体数据流

```
用户操作
  ↓
React 组件
  ↓
AnalyticsService.trackEvent()
  ↓
window.dataLayer.push()
  ↓
Google Tag Manager
  ↓
Google Analytics 4
  ↓
报告和分析
```

### 4.2 转化漏斗

```
访问首页
  ↓ (追踪: page_view)
点击 CTA
  ↓ (追踪: cta_clicked)
开始注册
  ↓ (追踪: signup_started)
完成注册
  ↓ (追踪: signup_completed)
首次使用功能
  ↓ (追踪: feature_used)
遇到付费墙
  ↓ (追踪: paywall_shown)
点击升级
  ↓ (追踪: upgrade_clicked)
完成付费
  ↓ (追踪: purchase_completed)
```

---

## 5. 技术债务和未来改进

### 5.1 当前限制

1. **追踪延迟**：客户端追踪可能丢失数据（页面关闭前）
2. **广告拦截**：部分用户可能拦截 GA/GTM
3. **隐私限制**：Safari ITP 限制 Cookie
4. **A/B 测试**：自建方案功能有限

### 5.2 未来改进方向

1. **服务端追踪**：
   - 实施服务端 GA4 Measurement Protocol
   - 更可靠的数据收集
   - 绕过广告拦截

2. **专业 A/B 测试工具**：
   - 集成 VWO 或 Optimizely
   - 更强大的实验功能
   - 更好的统计分析

3. **高级分析**：
   - 用户行为录制（Hotjar/FullStory）
   - 漏斗分析工具（Mixpanel/Amplitude）
   - 归因分析

4. **个性化**：
   - 基于行为的内容个性化
   - 动态定价
   - 智能推荐

---

## 6. 安全和隐私考虑

### 6.1 数据安全

- 不在追踪中包含 PII（个人身份信息）
- 使用用户 ID 而非邮箱
- 加密敏感数据
- 定期审计追踪代码

### 6.2 隐私合规

- GDPR 合规（欧盟）
- CCPA 合规（加州）
- Cookie 同意管理
- 数据删除请求处理
- 隐私政策更新

### 6.3 实施清单

- [ ] 实施 Cookie 同意横幅
- [ ] 提供退出追踪选项
- [ ] 更新隐私政策
- [ ] 实施数据删除流程
- [ ] 定期隐私审计

---

## 7. 监控和维护

### 7.1 监控指标

**技术指标：**
- 追踪代码加载时间
- 事件触发成功率
- 数据质量（缺失值、异常值）
- 页面性能（Core Web Vitals）

**业务指标：**
- 流量来源分布
- 转化率趋势
- 用户留存率
- 收入指标

### 7.2 维护计划

**每日：**
- 检查 GA4 实时报告
- 监控错误日志

**每周：**
- 审查关键指标
- 检查 A/B 测试进度
- 分析用户反馈

**每月：**
- 生成综合报告
- 识别优化机会
- 更新追踪文档
- 审计数据质量

**每季度：**
- 全面 SEO 审计
- 竞品分析
- 策略调整
- 技术债务清理

---

## 8. 文档和培训

### 8.1 文档清单

- [ ] 追踪计划文档
- [ ] 事件命名规范
- [ ] GTM 配置文档
- [ ] A/B 测试指南
- [ ] SEO 策略文档
- [ ] 文案风格指南

### 8.2 团队培训

- GA4 基础培训
- GTM 使用培训
- A/B 测试方法论
- SEO 最佳实践
- 数据驱动决策

---

## 9. 成本估算

### 9.1 工具成本

- Google Analytics 4：免费
- Google Tag Manager：免费
- Google Search Console：免费
- Web Vitals 库：免费
- **总计：$0/月**

### 9.2 可选工具（未来）

- VWO/Optimizely：$200-500/月
- Hotjar：$39-99/月
- Mixpanel：$25-100/月
- Ahrefs/Semrush：$99-399/月

### 9.3 开发成本

- 初始实施：60-80 小时
- 持续维护：10-15 小时/月

---

## 10. 风险缓解

### 10.1 技术风险

**风险：追踪代码影响性能**
- 缓解：异步加载，延迟非关键追踪
- 监控：Core Web Vitals 指标

**风险：数据丢失**
- 缓解：实施服务端追踪备份
- 监控：数据完整性检查

**风险：隐私合规问题**
- 缓解：法律审查，Cookie 同意
- 监控：定期合规审计

### 10.2 业务风险

**风险：优化效果不明显**
- 缓解：小步快跑，快速迭代
- 监控：设置短期和长期指标

**风险：用户体验下降**
- 缓解：充分测试，用户反馈
- 监控：用户满意度调查

---

## 附录

### A. 技术栈总结

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **路由**：React Router (HashRouter)
- **分析**：GA4 + GTM
- **SEO**：自定义 SEO 组件 + Schema.org
- **追踪**：自定义 AnalyticsService

### B. 关键文件清单

```
/services/
  analytics.ts          # 追踪服务
  consent.ts            # 同意管理
  paywallService.ts     # 付费墙服务
  abTest.ts             # A/B 测试
  webVitals.ts          # 性能监控

/components/
  SEO.tsx               # SEO 组件（扩展）
  auth/
    PaywallModal.tsx    # 付费墙模态框
    LoginModal.tsx      # 登录模态框（优化）
  forms/
    ProgressiveForm.tsx # 渐进式表单

/scripts/
  generate-seo-pages.mjs  # SEO 页面生成

/types/
  analytics.ts          # 追踪类型定义
```

### C. 参考资源

- [GA4 文档](https://developers.google.com/analytics/devguides/collection/ga4)
- [GTM 文档](https://developers.google.com/tag-platform/tag-manager)
- [Schema.org](https://schema.org/)
- [Web Vitals](https://web.dev/vitals/)
- [Google Search Central](https://developers.google.com/search)
