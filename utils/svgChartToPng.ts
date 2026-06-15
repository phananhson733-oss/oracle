// INPUT: 一个已渲染的自包含 <svg> 星盘元素（viewBox 固定，所有 glyph 为 SVG <text>）。
// OUTPUT: downloadSvgChartAsPng(svg, filename, size?) —— 序列化 SVG → canvas → 触发浏览器下载 PNG。
// POS: 星盘图片导出工具（纯浏览器 API，无第三方依赖）。若更新此文件，务必更新本头注释与所属 FOLDER.md。

/**
 * 把一个自包含的星盘 <svg> 导出为 PNG 并触发下载。
 *
 * 实现：克隆 SVG → 固定输出尺寸 → 序列化为 data blob → 载入 <img> →
 * 画到离屏 <canvas> → canvas.toBlob('image/png') → <a download> 触发下载。
 * 全程同源 blob，canvas 不会被污染。
 *
 * 注意：独立渲染的 SVG 拿不到页面 CSS/webfont——占星 glyph 是系统字体 Unicode
 * 字符（正常渲染），度数等文本标签可能回退到默认字体（仍清晰可读）。
 */
export async function downloadSvgChartAsPng(
  svg: SVGSVGElement,
  filename: string,
  size = 1200,
): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(size));
  clone.setAttribute("height", String(size));
  // 外层 style 里的 drop-shadow 用了页面 CSS 变量，独立渲染无法解析，移除（仅影响外阴影）。
  clone.removeAttribute("style");

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.width = size;
    img.height = size;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG image load failed"));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    // 填深色 cosmic 底（星盘自带深色渐变圆，统一四角避免透明/白角割裂，更像成品分享图）。
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!blob) throw new Error("PNG encode failed");

    const pngUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
