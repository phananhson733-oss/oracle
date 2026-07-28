// INPUT: Vite 构建与开发配置。
// OUTPUT: 导出 Vite 构建配置（不注入服务端密钥；AdSense head-loader 须显式开启；生产 HTML 预加载主 CSS）。
// POS: 构建与开发配置。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const MAIN_CSS_LINK_RE =
  /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["'](\/assets\/index-[^"']+\.css)["'])[^>]*>/;

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // AdSense <head> loader（SPA 壳 dist/index.html）：仅当 VITE_ADSENSE_HEAD_LOADER_ENABLED=true
        // 且 VITE_ADSENSE_CLIENT_ID 为合法 ca-pub-XXXX 时注入原始 HTML <head>，供 Google 审核验证 + CMP 全站加载。
        // 默认关闭，避免首页 PageSpeed 首字节必拉广告脚本、第三方 cookie 与 CSP report-only 噪音。格式校验防注入。
        // 与前端 loadAdsense 共用 id='astro-adsense'。SEO stub 的同一注入见 generate-seo-pages.mjs。
        {
          name: 'adsense-head-loader',
          transformIndexHtml(html) {
            if (process.env.VITE_ADSENSE_HEAD_LOADER_ENABLED !== 'true') return html;
            const client = (process.env.VITE_ADSENSE_CLIENT_ID || '').trim();
            if (!/^ca-pub-\d{10,25}$/.test(client)) return html;
            const tag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous" id="astro-adsense"></script>`;
            return html.replace('</head>', `    ${tag}\n  </head>`);
          },
        },
        {
          name: 'main-css-preload',
          transformIndexHtml: {
            order: 'post',
            handler(html) {
              const match = html.match(MAIN_CSS_LINK_RE);
              if (!match) return html;
              const [tag, href] = match;
              if (html.includes(`rel="preload" as="style"`) && html.includes(`href="${href}"`)) {
                return html;
              }
              const crossorigin = /\bcrossorigin\b/.test(tag) ? ' crossorigin' : '';
              const preload = `<link rel="preload" as="style"${crossorigin} href="${href}">`;
              return html.replace(/(<meta name="viewport"[^>]*>\s*)/, `$1\n    ${preload}`);
            },
          },
        },
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'charts': ['recharts'],
              'google-ai': ['@google/genai'],
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: mode === 'development',
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'recharts', '@google/genai'],
      }
    };
});
