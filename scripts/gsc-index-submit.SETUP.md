# Google Indexing API 配置指南（gsc-index-submit.mjs）

让 `scripts/gsc-index-submit.mjs` 能主动通知 Google 抓取新发布的文章 URL。
配置一次，长期生效（之后 autopilot merge 后自动提交）。

> 安全：service account JSON 含私钥。**绝不要贴进聊天 / 提交进 git**。只存本地文件。

---

## A. Google Cloud（建 service account + 开 API + 下载 key）

1. 打开 https://console.cloud.google.com/ ，右上角选一个项目，或新建一个
   （名字随意，如 `astrologywiki-seo`）。

2. **启用 Indexing API**：访问
   https://console.cloud.google.com/apis/library/indexing.googleapis.com
   确认顶部是你刚选的项目 → 点 **Enable / 启用**。

3. **建 service account**：访问
   https://console.cloud.google.com/iam-admin/serviceaccounts
   → **Create service account / 创建服务账号**
   - 名称：`indexing-bot`（随意）
   - 第 2 步“授予项目角色”：**留空跳过**（Indexing API 的权限来自 Search Console，不是 IAM 角色）
   - 点 **Done / 完成**

4. **下载 JSON key**：在列表里点刚建的 SA → **Keys / 密钥** 标签
   → **Add key / 添加密钥** → **Create new key / 创建新密钥** → 选 **JSON** → **Create**
   → 浏览器自动下载一个 `xxx.json` 文件（这就是凭据）。

5. 记下这个 SA 的邮箱（JSON 里的 `client_email`，形如
   `indexing-bot@astrologywiki-seo.iam.gserviceaccount.com`）。

---

## B. Search Console（把 SA 加为 Owner —— 关键步骤）

6. 打开 https://search.google.com/search-console → 左上角选
   **astrologywiki.com** 资源。

7. 左下 **设置（齿轮）→ 用户和权限 → 添加用户**
   - 邮箱：粘贴上面的 `client_email`
   - 权限：**必须选「所有者 / Owner」**（Indexing API 只认 Owner，Full/Restricted 都不行）
   - 添加。

> 注意资源类型要对得上：
> - 若是「网域 / Domain」资源（`sc-domain:astrologywiki.com`）→ Owner 即覆盖所有子域和协议。
> - 若是「网址前缀 / URL-prefix」资源（`https://www.astrologywiki.com/`）→ SA 必须是**这个前缀**的 Owner，且提交的 URL 要匹配该前缀（我们提交的就是 `https://www.astrologywiki.com/...`）。

---

## C. 放文件 + 告诉我路径

8. 把下载的 JSON 移到一个稳定路径（别留在 Downloads）：
   ```bash
   mkdir -p ~/.config/gg
   mv ~/Downloads/<下载的文件名>.json ~/.config/gg/google-indexing-sa.json
   chmod 600 ~/.config/gg/google-indexing-sa.json
   ```
9. **只把路径发我**（`~/.config/gg/google-indexing-sa.json`），不要贴内容。

---

## D. 我会跑什么

```bash
# 批量提交今天这 30 篇的 EN + ZH（显式 URL，精确不浪费配额）
GOOGLE_INDEXING_SA=~/.config/gg/google-indexing-sa.json \
  node scripts/gsc-index-submit.mjs --url https://www.astrologywiki.com/en/wiki/<slug> ...
```

之后每次 autopilot `--merge` 发布会自动调它（已接入 `gg-seo-autopilot.mjs`），
新文章发布即通知 Google。

---

## 说明 / 限制

- 配额：默认 **200 URL/天**（`GSC_INDEX_MAX` 可调）。
- Indexing API 官方文档标注用于 JobPosting/BroadcastEvent，但通用页面实测能加速抓取。
- 这是「请 Google 来抓」的通知，不保证一定收录（收录仍取决于内容质量/站点权重）。
- 与现有 `ping-indexnow.mjs`（构建期通知 Bing/Yandex）并列，补上 Google 通道。
- 无凭据时脚本静默 no-op exit 0，永不阻断部署。
