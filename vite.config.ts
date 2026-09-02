// INPUT: Vite 构建与开发配置。
// OUTPUT: 导出 Vite 构建配置（不注入服务端密钥；AdSense head-loader 须显式开启；生产 HTML 预加载主 CSS）。
// POS: 构建与开发配置。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildAdsenseHeadTag } from './scripts/lib/adsense-head-tag.mjs';

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
        // AdSense <head> loader（SPA 壳 dist/index.html）：门控（HEAD_LOADER_ENABLED + client id
        // 格式校验）收口在 scripts/lib/adsense-head-tag.mjs，与 SEO stub（generate-seo-pages.mjs）
        // 共用同一真相源，避免两处逻辑漂移。默认关闭，平时首字节零第三方脚本。
        {
          name: 'adsense-head-loader',
          transformIndexHtml(html) {
            const tag = buildAdsenseHeadTag();
            if (!tag) return html;
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
