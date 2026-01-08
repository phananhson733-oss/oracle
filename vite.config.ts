// INPUT: Vite 构建与开发配置。
// OUTPUT: 导出 Vite 构建配置（不注入服务端密钥）。
// POS: 构建与开发配置。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
