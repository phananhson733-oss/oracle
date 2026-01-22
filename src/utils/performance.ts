// INPUT: 性能监控工具函数与 Web Vitals 上报。
// OUTPUT: 导出性能测量和 Core Web Vitals 监控函数。
// POS: 性能监控工具；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { Metric } from 'web-vitals';
import { trackEvent } from '../../services/analytics';
import { hasAnalyticsConsent } from '../../services/consent';

const pendingWebVitals: Metric[] = [];

const pushWebVitals = (metric: Metric) => {
  trackEvent('web_vitals', {
    metric_name: metric.name,
    metric_value: metric.value,
    metric_delta: metric.delta,
    metric_id: metric.id,
    metric_rating: metric.rating,
  });
};

export const flushQueuedWebVitals = () => {
  if (!hasAnalyticsConsent()) return;
  while (pendingWebVitals.length > 0) {
    const metric = pendingWebVitals.shift();
    if (metric) pushWebVitals(metric);
  }
};

/**
 * 测量并报告 Core Web Vitals
 */
export const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((webVitals) => {
      const { onCLS, onFCP, onINP, onLCP, onTTFB } = webVitals;
      onCLS(onPerfEntry);
      onINP(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    }).catch(() => {
      // web-vitals 未安装时静默失败
    });
  }
};

export const reportWebVitalsToAnalytics = () => {
  reportWebVitals((metric) => {
    if (!hasAnalyticsConsent()) {
      pendingWebVitals.push(metric);
      return;
    }
    pushWebVitals(metric);
  });
};

/**
 * 性能标记工具
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * 开始测量
   */
  start(label: string) {
    this.marks.set(label, performance.now());
  }

  /**
   * 结束测量并返回耗时（毫秒）
   */
  end(label: string): number | null {
    const startTime = this.marks.get(label);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    // 在开发环境下输出性能日志
    if (import.meta.env.DEV) {
      console.log(`⏱️ [Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * 测量异步操作
   */
  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

/**
 * 全局性能监控实例
 */
export const perfMonitor = new PerformanceMonitor();

/**
 * 监控组件渲染性能
 */
export const measureRender = (componentName: string) => {
  if (import.meta.env.DEV) {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 16) { // 超过一帧的时间
        console.warn(`⚠️ [Slow Render] ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  }
  return () => {};
};

/**
 * 监控 API 调用性能
 */
export const measureApiCall = async <T>(
  endpoint: string,
  fetchFn: () => Promise<T>
): Promise<T> => {
  const label = `API: ${endpoint}`;
  return perfMonitor.measure(label, fetchFn);
};

/**
 * 获取当前页面性能指标
 */
export const getPageMetrics = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return null;

  return {
    // 页面加载时间
    loadTime: navigation.loadEventEnd - navigation.fetchStart,
    // DOM 解析时间
    domParseTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    // 首次内容绘制
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
    // DNS 查询时间
    dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP 连接时间
    tcpTime: navigation.connectEnd - navigation.connectStart,
    // 请求响应时间
    requestTime: navigation.responseEnd - navigation.requestStart,
  };
};

/**
 * 在控制台输出性能报告
 */
export const logPerformanceReport = () => {
  if (import.meta.env.DEV) {
    const metrics = getPageMetrics();
    if (metrics) {
      console.group('📊 Performance Report');
      console.table(metrics);
      console.groupEnd();
    }
  }
};
