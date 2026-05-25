// INPUT: Playwright test API；前端静态文章/作者数据（无需 backend，作者页与列表均由 data/* 渲染）。
// OUTPUT: 导出作者页 E2E 用例（有效 authorId 渲染、无效降级、详情页 byline→作者页、作者页→文章）。
// POS: /:lang/wiki/author/:authorId 路由 E2E 用例集。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { expect, test } from "@playwright/test";

const ELENA = {
  id: "elena-vane",
  name: "Elena Vane",
  title: "Aura & Energy Columnist",
  // 一篇确定归属 Elena 的文章 slug（aura 系列）。
  articleSlug: "blue-aura-meaning",
};

test.describe("/en/wiki/author — editorial author pages", () => {
  test("有效 authorId 渲染作者档案 + 文章列表", async ({ page }) => {
    await page.goto(`/en/wiki/author/${ELENA.id}`);

    // 作者名作为 H1，职位与披露可见。
    await expect(
      page.getByRole("heading", { level: 1, name: ELENA.name }),
    ).toBeVisible();
    await expect(page.getByText(ELENA.title, { exact: true })).toBeVisible();
    await expect(
      page.getByText("Editorial persona · AI-assisted"),
    ).toBeVisible();

    // 文章列表至少含该作者一篇文章的链接。
    await expect(
      page.locator(`a[href$="/wiki/${ELENA.articleSlug}"]`).first(),
    ).toBeVisible();
  });

  test("无效 authorId 降级为未命中提示，不渲染文章列表", async ({ page }) => {
    await page.goto("/en/wiki/author/nonexistent-author");

    // 未命中区块（AuthorPage 内 NotFound 降级）：显示提示 + 返回链接，不渲染作者 H1。
    await expect(
      page.getByRole("link", { name: /back to articles/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Elena Vane" }),
    ).toHaveCount(0);
  });

  test("详情页 byline 链接跳转到作者页", async ({ page }) => {
    await page.goto(`/en/wiki/${ELENA.articleSlug}`);

    // byline 中作者名是链接。
    const bylineLink = page
      .getByRole("link", { name: ELENA.name })
      .first();
    await expect(bylineLink).toBeVisible();
    await bylineLink.click();

    await expect(page).toHaveURL(new RegExp(`/wiki/author/${ELENA.id}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: ELENA.name }),
    ).toBeVisible();
  });

  test("作者页文章链接跳转到详情页", async ({ page }) => {
    await page.goto(`/en/wiki/author/${ELENA.id}`);

    const articleLink = page
      .locator(`a[href$="/wiki/${ELENA.articleSlug}"]`)
      .first();
    await expect(articleLink).toBeVisible();
    await articleLink.click();

    await expect(page).toHaveURL(new RegExp(`/wiki/${ELENA.articleSlug}$`));
  });
});
