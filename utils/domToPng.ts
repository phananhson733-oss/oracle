// INPUT: html-to-image 的 toPng + 一个 DOM 元素（含 HTML 表格 + SVG 轮盘混排）。
// OUTPUT: downloadElementAsPng(el, filename, opts?) —— 把元素截成 PNG 触发浏览器下载。
// POS: DOM→PNG 导出工具（星盘信息卡用，HTML+SVG 混排故需 html-to-image，非纯 SVG）。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { toPng } from "html-to-image";

/**
 * 把一个已渲染的元素（含 HTML + SVG）导出为 PNG 并触发下载。
 * pixelRatio=2 提清晰度；传 backgroundColor 给卡片填底；cacheBust 避免字体/图片缓存导致的空白。
 */
export async function downloadElementAsPng(
  el: HTMLElement,
  filename: string,
  opts?: { pixelRatio?: number; backgroundColor?: string },
): Promise<void> {
  const dataUrl = await toPng(el, {
    pixelRatio: opts?.pixelRatio ?? 2,
    backgroundColor: opts?.backgroundColor,
    cacheBust: true,
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
