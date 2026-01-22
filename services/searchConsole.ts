// INPUT: 无外部依赖
// OUTPUT: 导出 Search Console 监控配置函数

/**
 * Google Search Console 验证标记
 * 需要在 Google Search Console 验证网站所有权后使用
 */

export const searchConsoleVerification = () => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.astrologywiki.com';
  const verificationCode = 'verification_meta_tag';

  return {
    google: `<meta name="${verificationCode}" content="your_verification_code_from_gsc" />`,
    bing: `<meta name="msvalidate.01" content="${siteUrl}" />`,
    instructions: `
请在 Google Search Console 验证网站：

1. 访问：https://search.google.com/search-console
2. 选择资源类型：URL 前缀
3. 验证所有权（HTML 文件上传、DNS 记录、Google Analytics 或 Google Tag Manager）
4. 验证完成后，替换上面的 meta 标签中的 your_verification_code_from_gsc

当前验证标记：
<${verificationCode}> your_verification_code_from_gsc</${verificationCode}>
`,
  };
};

/**
 * Core Web Vitals 优化配置
 */
export const cwvOptimization = () => {
  return {
    targetMetrics: {
      LCP: 2500, // 2.5s
      FID: 100,  // 100ms
      CLS: 0.1, // 0.1 shift
      INP: 200, // 200ms
      TTFB: 600, // 600ms
    },
    optimizationTechniques: {
      preloadCriticalFonts: true,
      preloadAboveFoldImages: true,
      inlineCriticalCSS: true,
      minifyHTML: true,
      enableBrotliCompression: true,
      useCDN: true,
    },
    recommendations: {
      optimizeImages: '使用 WebP 格式，调整质量',
      deferNonCriticalJS: '延迟非关键 JavaScript 执行',
      preloadKeyResources: '预加载关键 CSS 和字体',
      reduceThirdPartyScripts: '最小化第三方脚本',
      implementResourceHints: '使用 resource hints',
    },
  };
};
