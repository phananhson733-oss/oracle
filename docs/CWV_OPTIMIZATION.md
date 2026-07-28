# Core Web Vitals 优化指南

本文档提供 Core Web Vitals（CWV）的优化策略与实施指南。

---

## 指标定义与目标

| 指标 | 定义 | 良好阈值 | 需改进 |
|------|------|----------|--------|
| LCP | Largest Contentful Paint，最大内容绘制时间 | ≤2.5s | >2.5s |
| INP | Interaction to Next Paint，交互到下次绘制 | ≤200ms | >200ms |
| CLS | Cumulative Layout Shift，累计布局偏移 | ≤0.1 | >0.1 |

---

## 当前实现

项目已集成 `web-vitals` 库进行 CWV 监控：

```tsx
// src/utils/performance.ts
import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';

// 上报到 GA4
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

---

## 优化策略

### 1. LCP 优化

#### 问题排查

1. **检查资源加载顺序**
   - CSS 应在 `<head>` 中阻塞渲染
   - 关键字体应预加载
   - 首屏图片应优先加载

2. **服务器响应时间**
   - 优化 TTFB（Time to First Byte）
   - 使用 CDN
   - 启用 Gzip/Brotli 压缩

3. **渲染阻塞资源**
   - 减少 JavaScript 体积
   - 延迟加载非关键 JS
   - 使用 `defer` 或 `async`

#### 优化措施

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="/hero-image.webp" as="image">

<!-- 延迟非关键脚本 -->
<script src="/analytics.js" defer></script>

<!-- 内联关键 CSS -->
<style>
  /* 首屏渲染所需的 CSS */
</style>
```

### 2. INP 优化

#### 问题排查

1. **长任务（Long Tasks）**
   - 超过 50ms 的 JavaScript 执行
   - 主线程阻塞

2. **事件处理**
   - 复杂的事件监听器
   - 不必要的 DOM 操作

#### 优化措施

```tsx
// 使用 requestIdleCallback 处理非紧急任务
import { useEffect } from 'react';

useEffect(() => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // 延迟加载非关键功能
      import('./heavyComponent');
    });
  }
}, []);

// 使用防抖处理频繁事件
import { useMemo, useCallback } from 'react';

const handleScroll = useMemo(
  () => debounce(() => {
    // 处理滚动逻辑
  }, 100),
  []
);
```

### 3. CLS 优化

#### 问题排查

1. **图片和广告位**
   - 图片缺少尺寸属性
   - 动态内容插入

2. **字体加载**
   - 字体切换导致的布局偏移（FOIT/FOUT）

3. **Web Fonts**
   - 使用 `font-display: swap`

#### 优化措施

```css
/* 为字体添加 fallback */
@font-face {
  font-family: 'CustomFont';
  src: url('/font.woff2') format('woff2');
  font-display: swap;
}

/* 为图片预留空间 */
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}

/* 避免动态插入内容 */
.ad-slot {
  min-height: 250px;
  background: #f5f5f5;
}
```

---

## 懒加载实现

### 图片懒加载

```tsx
import { useInView } from 'react-intersection-observer';

const LazyImage = ({ src, alt }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '50px 0px',
  });

  return (
    <img
      ref={ref}
      src={inView ? src : placeholder}
      alt={alt}
      loading="lazy"
    />
  );
};
```

### 组件懒加载

```tsx
// 使用 React.lazy
const WikiDetailPage = lazy(() => import('./components/wiki/WikiDetailPage'));

// 使用动态导入
const loadHeavyFeature = () => import('./features/heavyFeature');
```

---

## 性能监控

### Search Console 监控

1. 登录 [Search Console](https://search.google.com/search-console)
2. 进入 **核心网页指标** 报告
3. 监控不良 URL 数量
4. 排查问题页面

### PageSpeed Insights

访问 https://pagespeed.web.dev/ 分析页面性能。

### GA4 实时监控

在 GA4 中查看 CWV 指标：

1. **报告** > **参与度** > **核心网页指标**
2. 按页面维度分析
3. 设置自定义提醒

---

## 目标值

| 指标 | 目标 |
|------|------|
| LCP | < 2.5s（75% 的页面） |
| INP | < 200ms（75% 的页面） |
| CLS | < 0.1（75% 的页面） |

---

## 相关文档

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [web-vitals npm 包](https://www.npmjs.com/package/web-vitals)
- [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/about)
