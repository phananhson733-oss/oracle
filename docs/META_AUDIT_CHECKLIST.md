# Meta 标签审计清单

本文档用于审计和优化全站页面的 meta 标签。

---

## 审计范围

### 页面类型

| 页面 | 路径 | title 长度 | description 长度 | 优先级 |
|------|------|------------|------------------|--------|
| 首页 | `/` | 50-60 | 150-160 | 高 |
| Wiki 首页 | `/wiki` | 50-60 | 150-160 | 高 |
| Wiki 索引页 | `/wiki?tab=library` | 50-60 | 150-160 | 中 |
| Wiki 详情页 | `/wiki/{id}` | 40-60 | 150-160 | 高 |
| 登录/注册 | `/login` | 30-40 | 120-150 | 中 |
| 个人中心 | `/profile` | 30-40 | 120-150 | 低 |
| 付费订阅 | `/upgrade` | 30-40 | 120-150 | 中 |

---

## 审计清单

### 2.2 Meta 标签优化

#### Title 标签

- [ ] 每个页面有唯一的 title
- [ ] 长度在 50-60 字符之间
- [ ] 包含页面核心关键词
- [ ] 品牌名称在末尾（格式：`页面名 | 品牌`）

**示例：**
```
首页：占星与心理学自助平台 | AstrologyWiki
Wiki 详情页：太阳星座在白羊座 | AstrologyWiki Wiki
登录：登录/注册 | AstrologyWiki
```

#### Meta Description

- [ ] 每个页面有唯一的 description
- [ ] 长度在 150-160 字符之间
- [ ] 包含页面核心关键词
- [ ] 有吸引力的行动号召（CTA）

**示例：**
```
首页：探索占星与心理学的深度融合。通过 AI 驱动的星盘解读，深入了解自我、关系与成长路径。立即开始免费体验。

Wiki 详情页：详解太阳星座在白羊座的特征、性格优点与阴影面。包含心理学视角解读与实用成长建议。
```

#### Keywords Meta

- [x] 已实现自动生成（见 `SEO.tsx`）
- [ ] 包含核心关键词 3-5 个
- [ ] 使用逗号分隔

#### Open Graph 标签

- [x] og:type 正确设置
- [x] og:title 完整（带品牌）
- [x] og:description 包含 CTA
- [x] og:image 尺寸 1200x630
- [x] og:url 正确
- [x] og:site_name 正确

#### Twitter Card 标签

- [x] twitter:card 设置为 summary_large_image
- [x] twitter:title 优化
- [x] twitter:description 优化
- [x] twitter:image 优化

#### Canonical 标签

- [x] 每个页面有 canonical URL
- [ ] 指向最规范的 URL 版本
- [ ] 避免带参数的重复页面

#### hreflang 标签

- [x] 正确设置中英文版本
- [x] 包含 x-default
- [ ] URL 格式正确

---

## 当前 SEO 组件支持

`components/SEO.tsx` 已支持：

```tsx
<SEO
  title="页面标题"
  description="页面描述"
  keywords={['关键词1', '关键词2']}
  image="/og-image.png"
  url="https://astrologywiki.com/..."
  type="website" // 或 "article"
  alternateLanguages={[
    { hrefLang: 'zh', href: 'https://astrologywiki.com/zh/...' },
    { hrefLang: 'en', href: 'https://astrologywiki.com/en/...' },
  ]}
  // Article 专用
  publishedTime="2026-01-01T00:00:00Z"
  modifiedTime="2026-01-15T00:00:00Z"
  authorName="作者名"
  section="分类"
  tags={['标签1', '标签2']}
  schema={/* 结构化数据 */}
/>
```

---

## 验证工具

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Meta Tags Inspector**: https://metatags.io/
3. **Social Share Preview**: https://socialsharepreview.com/

---

## 相关文档

- [SEO 组件源码](../../components/SEO.tsx)
- [结构化数据规范](./SCHEMA_GUIDE.md)
