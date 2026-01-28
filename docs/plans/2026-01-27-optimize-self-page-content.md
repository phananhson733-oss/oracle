# Optimize Self Page Content Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorder self page modules, localize AI prompts for Big3/12-dimension/6-domain/appendix content, and upgrade the detail modal UI + API integration for on-demand content.

**Architecture:** Add self-page prompt modules under `backend/src/prompts/self-page/` and register them in `prompts/manager.ts`. Extend `/api/detail` to accept new `type` values and map them to the new prompt IDs (passing extra keys such as `target`/`dimension`/`domain`). On the miniprogram self page, wire “查看详情” triggers to call `/api/detail`, render modal states (loading/error/success), and apply COLOR_SYSTEM_GUIDE-compliant styling.

**Tech Stack:** WeChat miniprogram (WXML/WXSS/JS), Node/Express backend, prompt manager, DeepSeek AI service, Redis cache (existing).

---

### Task 1: Reorder self page modules and rename titles

**Files:**
- Modify: `astromind/miniprogram/pages/self/self.wxml`

**Step 1: Define expected order and titles (manual check)**
- Create a quick visual checklist in this plan: 本命盘→Big3→12维→6大维度→专业附录→流年运势。

**Step 2: Update WXML ordering and title text**
- Move the premium banner to the bottom.
- Move the 12维模块 to immediately after Big3.
- Rename titles to: “12维心理解读”、“深度解析6大维度”、“专业星象数据附录”.

**Step 3: Run a quick manual view check**
- Open the self page in the devtools and verify section order and titles.

**Step 4: Adjust any inline labels**
- Ensure no leftover “心理维度分析 (12维度)” or “深度解析/专业技术附录” text.

**Step 5: Commit (optional)**
```bash
git add astromind/miniprogram/pages/self/self.wxml
git commit -m "feat: reorder self page sections and update titles"
```

---

### Task 2: Add self page detail modal UI structure

**Files:**
- Modify: `astromind/miniprogram/pages/self/self.wxml`
- Modify: `astromind/miniprogram/pages/self/self.wxss`

**Step 1: Draft modal structure (use @frontend-design)**
- Define a single modal panel with: title, subtitle, divider, content area, actions.
- Include loading state and error state blocks.

**Step 2: Update WXML modal markup**
- Replace the existing `selectedItem` modal with a `detailModal` object-driven modal.
- Add `wx:if` blocks for `status === 'LOADING' | 'ERROR' | 'SUCCESS'`.

**Step 3: Update WXSS styles per COLOR_SYSTEM_GUIDE**
- Use `space-950/space-900` background, `accent` highlights, generous padding (p-6/p-8 ≈ 40rpx).
- Add `transition: all 0.3s ease-in-out` on modal panel and buttons.
- Avoid nested card borders (flat layout).

**Step 4: Add small UI affordances**
- Add a subtle spinner (CSS) and retry button style.
- Ensure text contrast meets WCAG AA.

**Step 5: Commit (optional)**
```bash
git add astromind/miniprogram/pages/self/self.wxml astromind/miniprogram/pages/self/self.wxss
git commit -m "feat: redesign self page detail modal"
```

---

### Task 3: Wire self page detail modal logic (loading/error/on-demand)

**Files:**
- Modify: `astromind/miniprogram/pages/self/self.js`
- Modify: `astromind/miniprogram/services/api.js`

**Step 1: Add API endpoint constant**
```js
// astromind/miniprogram/services/api.js
DETAIL: '/api/detail',
```

**Step 2: Add modal state + helpers in self.js**
- Add a `detailModal` object in `data`:
  - `visible`, `title`, `subtitle`, `status`, `content`, `error`, `type`, `retryPayload`.
- Add `openDetailModal(payload)`, `closeDetailModal()`, `retryDetail()` methods.

**Step 3: Implement detail fetch with request()**
```js
const { request } = require('../../utils/request');
// call request({ url: API_ENDPOINTS.DETAIL, method: 'POST', data: payload })
```
- On success, store `content` and set status `SUCCESS`.
- On failure, set status `ERROR` with user-friendly message.

**Step 4: Wire UI triggers to payloads**
- Big3 card tap → `{ type: 'big3', context: 'natal', chartData: { target: 'sun|moon|rising', ... } }`
- 12维维度 tag tap → `{ type: 'dimension', context: 'natal', chartData: { dimensionKey, ... } }`
- 6大维度 item tap → `{ type: 'deep', context: 'natal', chartData: { domainKey, ... } }`
- Appendix “查看详情” → `{ type: 'elements' | 'aspects' | 'planets', context: 'natal', chartData: {...} }`

**Step 5: Manual verification**
- Tap each trigger and ensure: loading → success/error → retry works.

**Step 6: Commit (optional)**
```bash
git add astromind/miniprogram/pages/self/self.js astromind/miniprogram/services/api.js

git commit -m "feat: add self page detail modal logic"
```

---

### Task 4: Create self page prompt modules (Big3, 12维, 6维, 附录)

**Files:**
- Create: `astromind/backend/src/prompts/self-page/FOLDER.md`
- Create: `astromind/backend/src/prompts/self-page/big3-prompts.ts`
- Create: `astromind/backend/src/prompts/self-page/dimension-prompts.ts`
- Create: `astromind/backend/src/prompts/self-page/deep-analysis-prompts.ts`
- Create: `astromind/backend/src/prompts/self-page/appendix-prompts.ts`
- Modify: `astromind/backend/src/prompts/manager.ts`
- Modify: `astromind/backend/src/prompts/FOLDER.md`

**Step 1: Add FOLDER.md for new prompts folder**
- Document purpose + file list, and update parent `prompts/FOLDER.md`.

**Step 2: Implement Big3 prompt template**
- Prompt ID: `detail-big3-natal`.
- Use `formatLang(ctx)` and `SINGLE_LANGUAGE_INSTRUCTION`.
- Accept `chartData.target` (sun/moon/rising) and include sun/moon/asc specific rules in system instructions.
- Output JSON structure: `{ lang, content: { title, text } }` where `text` is 180-220字.

**Step 3: Implement 12维 prompt template**
- Prompt ID: `detail-dimension-natal`.
- Accept `chartData.dimensionKey` and include a mapping table of 12维的“分析重点配置”.
- Output `content.text` with严格四段结构：
  - 【核心模式】 / 【具体表现】 / 【潜在挑战】 / 【成长建议】

**Step 4: Implement 6大维度深度解析 prompt**
- Prompt ID: `detail-deep-natal`.
- Accept `chartData.domainKey` with 6 domain configs (career/wealth/love/relations/health/growth).
- Output `content.text` with 5 段结构（不使用 Markdown `##`，用“ 一、二、三、四、五 ”标题）。
- Ensure word count rules per domain (450-550 or 500-600) and include健康免责声明。

**Step 5: Implement 专业附录 prompt**
- Prompt ID: `detail-appendix-natal` (if needed), OR keep existing `detail-elements-natal`/`detail-aspects-natal`/`detail-planets-natal` and only add self-page specific appendix prompt IDs as required.
- If new prompt IDs are required for self page, ensure table-like text is returned as plain text lines (no Markdown rendering dependencies).

**Step 6: Register prompts**
- Import the self-page prompt modules in `prompts/manager.ts` and register via `registerPrompt(...)`.

**Step 7: Commit (optional)**
```bash
git add astromind/backend/src/prompts/self-page astromind/backend/src/prompts/manager.ts astromind/backend/src/prompts/FOLDER.md

git commit -m "feat: add self page prompt templates"
```

---

### Task 5: Extend AI service + detail API type mapping

**Files:**
- Modify: `astromind/backend/src/services/ai.ts`
- Modify: `astromind/backend/src/api/detail.ts`

**Step 1: Add temperature mapping**
- Add prompt IDs (`detail-big3-natal`, `detail-dimension-natal`, `detail-deep-natal`, plus appendix IDs if new) to `TEMPERATURE_MAP` (use 0.3–0.5 depending on depth; recommend 0.5 for deep analysis, 0.3 for appendix).

**Step 2: Extend DetailType and mapping**
- Add `big3`, `dimension`, `deep` (and any appendix type if needed) to the `DetailType` union.
- If mapping uses `detail-${type}-${context}`, ensure prompt IDs match.

**Step 3: Pass extra keys in prompt context**
- Ensure `chartData` contains `target`/`dimensionKey`/`domainKey` when needed.
- Keep request validation minimal; use existing checks for required fields.

**Step 4: Manual verification**
- Use a local curl (if available) or small node script to call `/api/detail` with sample payloads and confirm JSON response shape.

**Step 5: Commit (optional)**
```bash
git add astromind/backend/src/services/ai.ts astromind/backend/src/api/detail.ts

git commit -m "feat: extend detail API for self page prompts"
```

---

### Task 6: Connect self page UI to new detail types

**Files:**
- Modify: `astromind/miniprogram/pages/self/self.wxml`
- Modify: `astromind/miniprogram/pages/self/self.js`
- Modify: `astromind/miniprogram/pages/self/self.wxss`

**Step 1: Add 12维维度入口**
- Add a compact grid of 12 dimension buttons (text only, no emoji) below the radar chart.
- Each button triggers `onDimensionTap` with `dimensionKey`.

**Step 2: Update 6大维度 data**
- Replace `lifeDomains` with the six required categories and ids: `career`, `wealth`, `love`, `relations`, `health`, `growth`.

**Step 3: Add appendix detail buttons**
- Add “查看详情” buttons in accordion headers for `planets`, `elements`, `aspects` (and others if present).

**Step 4: Manual verification**
- Ensure each button opens the modal, shows loading/error, and displays content.

**Step 5: Commit (optional)**
```bash
git add astromind/miniprogram/pages/self/self.wxml astromind/miniprogram/pages/self/self.js astromind/miniprogram/pages/self/self.wxss

git commit -m "feat: wire self page detail triggers"
```

---

### Task 7: Validation & QA

**Files:**
- Manual checks only (no automated tests configured).

**Step 1: UI order & titles**
- Verify module order and renamed titles on self page.

**Step 2: Modal states**
- Force success/failure (by toggling network or invalid payload) to verify loading + error + retry.

**Step 3: Prompt compliance spot checks**
- Sample outputs for Big3 / 12维 / 6维 / 附录 ensure word counts and structure.

**Step 4: Document completion**
- Update `openspec/changes/optimize-self-page-content/tasks.md` to mark completed tasks.

