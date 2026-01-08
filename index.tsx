// INPUT: ReactDOM 与主应用组件。
// OUTPUT: 挂载主应用到 DOM。
// POS: 主应用渲染入口。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);