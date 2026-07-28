## 1. Content Migration & Normalization
- [x] 1.1 建立 20 本书的 id/标题/作者/分类映射（zh/en）。
- [x] 1.2 迁移根目录中文 Markdown 至 `backend/data/classics_reports/<id>/zh/report.md`。
- [x] 1.3 迁移 `english_analysis` 英文 Markdown 至 `backend/data/classics_reports/<id>/en/report.md`。
- [x] 1.4 删除旧的经典拆解目录（包含中文与英文）。
- [x] 1.5 清理 Markdown 头尾装饰、统计尾注与过度强调符号，限制为标题/列表/段落。
- [x] 1.6 生成并提交新的 `backend/src/data/wiki-classics-markdown.js`（覆盖 zh/en）。

## 2. Backend Integration
- [x] 2.1 更新经典书籍 metadata 列表为 20 本并补齐分类字段。
- [x] 2.2 `/api/wiki/classics` 仅返回 20 本条目且包含分类字段。
- [x] 2.3 `/api/wiki/classics/:id` 保证命中对应 Markdown 内容。
- [x] 2.4 更新缓存版本号，确保经典列表/详情刷新。

## 3. Frontend Rendering & Kindle Style
- [x] 3.1 经典详情页调整为 Kindle 墨水屏风格排版（字体、纸感、层级）。
- [x] 3.2 保持 Markdown 渲染与滚动体验一致，阅读区宽度与段落节奏优化。
- [x] 3.3 经典书架按分类分组展示保持一致。

## 4. Validation
- [ ] 4.1 手动验证：经典页签展示 20 本书且分类正确。
- [ ] 4.2 手动验证：点击任意书籍均能加载对应内容。
- [ ] 4.3 手动验证：经典详情阅读排版与中英文切换一致。
- [ ] 4.4 手动验证：二次打开命中本地缓存，无重复请求。
