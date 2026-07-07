// INPUT: ReactDOM、主应用组件、全局样式入口与非关键初始化调度器。
// OUTPUT: 挂载主应用到 DOM，并将分析/性能监控/AdSense TCF 监听延迟到首屏后或首次交互后。
// POS: 主应用渲染入口。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initAnalytics, trackFirstVisitIfNew, trackError } from './services/analytics';
import { reportWebVitalsToAnalytics } from './src/utils/performance';
import { getAdsenseClientId, initTcfListener } from './services/adsense';
import { scheduleNonCriticalInit } from './src/utils/nonCriticalInitScheduler';

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
  // AdSense TCF 监听：仅当配置了 client id（head-loader 会加载 Google CMP）时启动，
  // 轮询等 window.__tcfapi 就位后注册（评审 B1，与 loadAdsense/广告门控解耦）。
  if (getAdsenseClientId()) initTcfListener();
};

scheduleNonCriticalInit(window, initNonCritical);

// Global error tracking
window.addEventListener('error', (event) => {
  trackError(event.message || 'Unknown error', event.filename || 'unknown');
});
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
  trackError(message, 'unhandled_promise');
});
