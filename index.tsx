// INPUT: ReactDOM、主应用组件与全局样式入口（含分析追踪初始化）。
// OUTPUT: 挂载主应用到 DOM 并启动分析与性能监控（含全局样式加载）。
// POS: 主应用渲染入口。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initAnalytics, trackFirstVisitIfNew, trackError } from './services/analytics';
import { reportWebVitalsToAnalytics } from './src/utils/performance';

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

const initNonCritical = () => {
  initAnalytics();
  reportWebVitalsToAnalytics();
  trackFirstVisitIfNew();
};

if ('requestIdleCallback' in window) {
  requestIdleCallback(initNonCritical);
} else {
  setTimeout(initNonCritical, 2000);
}

// Global error tracking
window.addEventListener('error', (event) => {
  trackError(event.message || 'Unknown error', event.filename || 'unknown');
});
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
  trackError(message, 'unhandled_promise');
});
