# 程序化 SEO 页面设计指南

本文档描述程序化 SEO 页面的设计规范与实施策略。

---

## 概述

程序化 SEO 是通过模板和数据自动生成大量长尾页面，覆盖更多搜索意图。

---

## 页面类型

### 2.6.1 行星在星座（Planet in Sign）

| 项目 | 说明 |
|------|------|
| 路径 | `/wiki/[planet]-in-[sign]` |
| 数量 | 10 行星 × 12 星座 = 120 页 |
| 示例 | `/wiki/sun-in-aries`, `/wiki-moon-in-cancer` |

**页面结构：**

```tsx
// 模板路径: pages/wiki/[planet]-in-[sign].tsx

interface Props {
  planet: Planet;
  sign: Sign;
  content: {
    general: string;
    personality: string;
    relationships: string;
    career: string;
  };
}

export const PlanetInSignPage: React.FC<Props> = ({ planet, sign, content }) => (
  <SEO
    title={`${planet.name}在${sign.name}的性格特征与运势解读`}
    description={`深入了解${planet.name}落入${sign.name}座的独特表现。${content.general.slice(0, 100)}...`}
    type="article"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${planet.name}在${sign.name}`,
    }}
  />
  // 页面内容...
);
```

### 2.6.2 相位页面（Planet Aspect Planet）

| 项目 | 说明 |
|------|------|
| 路径 | `/wiki/[planet]-[aspect]-[planet]` |
| 数量 | ~100+ 页（主要相位组合） |
| 示例 | `/wiki/sun-conjunction-moon`, `/wiki-venus-square-mars` |

**页面结构：**

```tsx
// 模板路径: pages/wiki/[planet]-[aspect]-[planet].tsx

interface Props {
  planet1: Planet;
  aspect: Aspect;
  planet2: Planet;
  content: {
    dynamics: string;
    challenges: string;
    opportunities: string;
  };
}

export const AspectPage: React.FC<Props> = ({ planet1, aspect, planet2, content }) => (
  <SEO
    title={`${planet1.name}与${planet2.name}的${aspect.name}相位解读`}
    description={`${planet1.name}${aspect.symbol}${planet2.name}相位代表...${content.dynamics.slice(0, 100)}...`}
    type="article"
  />
);
```

### 2.6.3 行星在宫位（Planet in House）

| 项目 | 说明 |
|------|------|
| 路径 | `/wiki/[planet]-in-house-[number]` |
| 数量 | 10 行星 × 12 宫 = 120 页 |
| 示例 | `/wiki/sun-in-house-1`, `/wiki-venus-in-house-7` |

---

## 数据源

### 静态数据模板

```ts
// data/planet-in-sign/index.ts

export const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
export const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'] as const;

export const ASPECTS = [
  { name: 'conjunction', symbol: '☌', angle: 0 },
  { name: 'sextile', symbol: '□', angle: 60 },
  { name: 'square', symbol: '∠', angle: 90 },
  { name: 'trine', symbol: '△', angle: 120 },
  { name: 'quincunx', symbol: '⚻', angle: 150 },
  { name: 'opposition', symbol: '☍', angle: 180 },
] as const;

export const HOUSES = Array.from({ length: 12 }, (_, i) => i + 1);
```

### 内容生成策略

1. **模板化内容**：使用占星学规则生成基础描述
2. **数据驱动**：从数据库或 API 获取行星/星座/宫位描述
3. **AI 增强**：使用 AI 生成更丰富的内容变体

---

## SEO 元素优化

### Meta 标签

| 元素 | 最佳实践 |
|------|----------|
| title | `{行星}在{星座}座的性格特征与运势解读 \| Astromind` |
| description | 150-160 字符，包含关键词 |
| h1 | 与 title 一致 |
| h2 | 包含变体关键词 |

### 结构化数据

```ts
const generateArticleSchema = (planet: string, sign: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: `${planet}在${sign}`,
  description: `...`,
  author: {
    '@type': 'Organization',
    name: 'Astromind',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Astromind',
    logo: {
      '@type': 'ImageObject',
      url: 'https://astrologywiki.com/logo.png',
    },
  },
});
```

### 内部链接

```tsx
// 在页面底部添加相关链接
const RelatedLinks = ({ planet, sign }) => (
  <div className="related-links">
    <h3>相关内容</h3>
    <ul>
      <li><a href={`/wiki/${planet}`}>{planet} 详解</a></li>
      <li><a href={`/wiki/${sign}`}>{sign} 详解</a></li>
      <li><a href={`/wiki/${planet}-ruling-${sign}`}>{planet} 守护的 {sign}</a></li>
    </ul>
  </div>
);
```

---

## Sitemap 生成

```ts
// scripts/generate-sitemap.ts

import { writeFileSync } from 'fs';
import { PLANETS, SIGNS, ASPECTS, PLANETS as P2, HOUSES } from '../data';

const BASE_URL = 'https://www.astrologywiki.com';

function generateUrls() {
  const urls: string[] = [];

  // Planet in Sign (120 pages)
  PLANETS.forEach(planet => {
    SIGNS.forEach(sign => {
      urls.push(`${BASE_URL}/wiki/${planet}-in-${sign}`);
    });
  });

  // Planet Aspect Planet (~100 pages)
  PLANETS.forEach(p1 => {
    ASPECTS.forEach(aspect => {
      PLANETS.forEach(p2 => {
        if (p1 < p2) { // 避免重复
          urls.push(`${BASE_URL}/wiki/${p1}-${aspect.name}-${p2}`);
        }
      });
    });
  });

  // Planet in House (120 pages)
  PLANETS.forEach(planet => {
    HOUSES.forEach(house => {
      urls.push(`${BASE_URL}/wiki/${planet}-in-house-${house}`);
    });
  });

  return urls;
}

function generateSitemap() {
  const urls = generateUrls();
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFileSync('public/sitemap-programmatic.xml', sitemap);
  console.log(`Generated ${urls.length} URLs`);
}

generateSitemap();
```

---

## URL 结构规范

| 页面类型 | URL 模式 | 示例 |
|----------|----------|------|
| 行星在星座 | `/wiki/{planet}-in-{sign}` | `/wiki/sun-in-aries` |
| 相位 | `/wiki/{planet}-{aspect}-{planet}` | `/wiki/venus-square-mars` |
| 行星在宫 | `/wiki/{planet}-in-house-{n}` | `/wiki/sun-in-house-1` |
| 守护关系 | `/wiki/{planet}-rules-{sign}` | `/wiki/mars-rules-aries` |

---

## 相关文档

- [关键词研究指南](./KEYWORD_RESEARCH.md)
- [Meta 标签审计清单](./META_AUDIT_CHECKLIST.md)
- [结构化数据规范](./SCHEMA_GUIDE.md)
