# UI 设计方案：今日运势页面优化

## 设计方向

**美学定位**: 东方禅意 × 现代极简 — 融合温暖大地色系与简洁数据可视化

**核心特点**:
- 浅色温暖背景（paper 色系）
- 大地棕/金色作为强调色
- 充足留白，层次分明
- 避免过度装饰，专注内容

---

## 色彩规范

| 用途 | Token | 说明 |
|------|------|------|
| 主色 | `--warm-brown` | 大地棕 |
| 强调色 | `--accent` | 金色 |
| 背景 | `--paper-100` | 温暖纸感 |
| 卡片背景 | `--paper-50` | 轻纸感层次 |
| 主文字 | `--star-50` | 主文本色 |
| 次文字 | `--paper-600` | 次级文本 |
| 弱文字 | `--paper-400` | 弱化文本 |
| 宜/积极 | `--success` | 橄榄绿 |
| 挑战 | `--danger` | 棕红色 |

---

## 1. 今日运势概览卡片

### WXML
```html
<!-- 今日运势概览卡片 -->
<view class="overview-card">
  <view class="overview-header">
    <view class="overview-date">
      <text class="date-label">今日运势</text>
      <text class="date-value">{{currentDateStr}}</text>
    </view>
    <view class="overview-score">
      <text class="score-number">{{forecast.overall_score || 78}}</text>
      <text class="score-suffix">分</text>
    </view>
  </view>
  
  <view class="overview-summary">
    <text class="summary-text">{{forecast.summary || '今日月亮与海王星的柔和相位为你带来直觉和灵感的高峰期。适合独处思考，整理情绪。'}}</text>
  </view>
  
  <view class="lucky-row">
    <view class="lucky-chip">
      <text class="lucky-label">幸运色</text>
      <view class="lucky-color-dot" style="background: {{luckyColorHex}}"></view>
      <text class="lucky-value">{{forecast.lucky_color || '雾灰'}}</text>
    </view>
    <view class="lucky-divider"></view>
    <view class="lucky-chip">
      <text class="lucky-label">幸运数</text>
      <text class="lucky-value lucky-number">{{forecast.lucky_number || '9'}}</text>
    </view>
    <view class="lucky-divider"></view>
    <view class="lucky-chip">
      <text class="lucky-label">吉位</text>
      <text class="lucky-value">{{forecast.lucky_direction || '西北'}}</text>
    </view>
  </view>
</view>
```

### WXSS
```css
.overview-card {
  background: linear-gradient(145deg, #8B7355 0%, #A68B6A 50%, #C6A062 100%);
  border-radius: 32rpx;
  padding: 48rpx;
  margin-bottom: 32rpx;
  position: relative;
  overflow: hidden;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32rpx;
}

.overview-date {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.date-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  letter-spacing: 0.1em;
}

.date-value {
  font-size: 28rpx;
  color: var(--paper-50);
  font-weight: 600;
}

.overview-score {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.score-number {
  font-size: 72rpx;
  font-weight: 700;
  color: var(--paper-50);
  line-height: 1;
  letter-spacing: -0.02em;
}

.score-suffix {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.overview-summary {
  margin-bottom: 40rpx;
  padding-right: 80rpx;
}

.summary-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  letter-spacing: 0.02em;
}

.lucky-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20rpx;
  padding: 24rpx 32rpx;
  backdrop-filter: blur(8px);
}

.lucky-chip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  justify-content: center;
}

.lucky-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.lucky-value {
  font-size: 26rpx;
  color: var(--paper-50);
  font-weight: 600;
}

.lucky-color-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.lucky-number {
  font-size: 32rpx;
  font-weight: 700;
}

.lucky-divider {
  width: 1rpx;
  height: 32rpx;
  background: rgba(255, 255, 255, 0.2);
}
```

---

## 2. 四维度评分网格

### WXML
```html
<!-- 四维度评分 -->
<view class="dimensions-section">
  <text class="section-title">四维运势</text>
  
  <view class="dimension-list">
    <view class="dimension-item" wx:for="{{dimensionItems}}" wx:key="key" bindtap="onDimensionTap" data-key="{{item.key}}">
      <view class="dimension-header">
        <view class="dimension-icon" style="background: {{item.color}}15; color: {{item.color}}">
          <view class="dimension-icon-inner icon-{{item.key}}"></view>
        </view>
        <text class="dimension-name">{{item.label}}</text>
        <text class="dimension-score" style="color: {{item.color}}">{{item.score}}</text>
      </view>
      <view class="dimension-bar-bg">
        <view class="dimension-bar-fill" style="width: {{item.score}}%; background: {{item.color}}"></view>
      </view>
      <view class="dimension-arrow">
        <text class="arrow-icon">›</text>
      </view>
    </view>
  </view>
</view>
```

### WXSS
```css
.dimensions-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--star-50);
  margin-bottom: 24rpx;
  display: block;
  padding-left: 8rpx;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.dimension-item {
  background: var(--paper-50);
  border: 1rpx solid var(--paper-200);
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  position: relative;
  transition: all 0.2s ease;
}

.dimension-item:active {
  transform: scale(0.98);
  background: #FAFAF8;
}

.dimension-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.dimension-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dimension-icon-inner {
  width: 28rpx;
  height: 28rpx;
  background-color: currentColor;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.dimension-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--star-50);
}

.dimension-score {
  font-size: 36rpx;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.dimension-bar-bg {
  height: 8rpx;
  background: #F0EBE3;
  border-radius: 4rpx;
  overflow: hidden;
}

.dimension-bar-fill {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.6s ease-out;
}

.dimension-arrow {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-icon {
  font-size: 36rpx;
  color: #C6A062;
  font-weight: 300;
}
```

---

## 3. 今日宜忌卡片

### WXML
```html
<!-- 今日宜忌 -->
<view class="advice-section">
  <view class="advice-card advice-do">
    <view class="advice-header">
      <view class="advice-badge do-badge">宜</view>
      <text class="advice-title-text">{{forecast.advice.do.title || '适合独处思考'}}</text>
    </view>
    <view class="advice-list">
      <view class="advice-item" wx:for="{{forecast.advice.do.details}}" wx:key="*this">
        <text class="advice-dot do-dot">·</text>
        <text class="advice-text">{{item}}</text>
      </view>
    </view>
  </view>
  
  <view class="advice-card advice-dont">
    <view class="advice-header">
      <view class="advice-badge dont-badge">忌</view>
      <text class="advice-title-text">{{forecast.advice.dont.title || '避免冲动决策'}}</text>
    </view>
    <view class="advice-list">
      <view class="advice-item" wx:for="{{forecast.advice.dont.details}}" wx:key="*this">
        <text class="advice-dot dont-dot">·</text>
        <text class="advice-text">{{item}}</text>
      </view>
    </view>
  </view>
</view>
```

### WXSS
```css
.advice-section {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.advice-card {
  flex: 1;
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
}

.advice-do {
  background: rgba(107, 142, 35, 0.06);
  border: 1rpx solid rgba(107, 142, 35, 0.12);
}

.advice-dont {
  background: rgba(139, 115, 85, 0.06);
  border: 1rpx solid rgba(139, 115, 85, 0.12);
}

.advice-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.advice-badge {
  width: 44rpx;
  height: 44rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.do-badge {
  background: var(--success);
  color: var(--paper-50);
}

.dont-badge {
  background: var(--warm-brown);
  color: var(--paper-50);
}

.advice-title-text {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--star-50);
  flex: 1;
  line-height: 1.4;
}

.advice-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}

.advice-dot {
  font-size: 32rpx;
  line-height: 1;
  margin-top: -4rpx;
}

.do-dot { color: #6B8E23; }
.dont-dot { color: #8B7355; }

.advice-text {
  font-size: 24rpx;
  color: #4A4540;
  line-height: 1.5;
  flex: 1;
}
```

---

## 4. 时间窗口组件

### WXML
```html
<!-- 时间窗口 -->
<view class="time-section card">
  <text class="card-title">时间窗口</text>
  
  <view class="time-timeline">
    <view class="time-slot" wx:for="{{timeWindows}}" wx:key="period">
      <view class="time-line">
        <view class="time-dot" style="background: {{item.dotColor}}"></view>
        <view class="time-connector" wx:if="{{index < timeWindows.length - 1}}"></view>
      </view>
      
      <view class="time-content">
        <view class="time-header">
          <text class="time-period">{{item.period}}</text>
          <text class="time-range">{{item.time}}</text>
          <view class="energy-tag" style="background: {{item.tagBg}}; color: {{item.tagColor}}">
            <text class="energy-icon">{{item.tag}}</text>
            <text class="energy-text">{{item.energyLevel}}</text>
          </view>
        </view>
        <text class="time-desc">{{item.description}}</text>
        <view class="time-tips" wx:if="{{item.bestFor.length > 0}}">
          <text class="tip-label">适合：</text>
          <text class="tip-value">{{item.bestForStr}}</text>
        </view>
      </view>
    </view>
  </view>
</view>
```

### WXSS
```css
.time-section {
  background: var(--paper-50);
  border: 1rpx solid var(--paper-200);
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
}

.time-timeline {
  display: flex;
  flex-direction: column;
}

.time-slot {
  display: flex;
  gap: 24rpx;
}

.time-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 24rpx;
}

.time-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.time-connector {
  width: 2rpx;
  flex: 1;
  min-height: 80rpx;
  background: var(--paper-200);
  margin: 8rpx 0;
}

.time-content {
  flex: 1;
  padding-bottom: 32rpx;
}

.time-slot:last-child .time-content {
  padding-bottom: 0;
}

.time-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.time-period {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--star-50);
}

.time-range {
  font-size: 22rpx;
  color: #7A746B;
}

.energy-tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 16rpx;
  border-radius: 100rpx;
  margin-left: auto;
}

.energy-icon {
  font-size: 20rpx;
}

.energy-text {
  font-size: 20rpx;
  font-weight: 600;
}

.time-desc {
  font-size: 26rpx;
  color: #4A4540;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.time-tips {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.tip-label {
  font-size: 22rpx;
  color: #7A746B;
}

.tip-value {
  font-size: 22rpx;
  color: #6B8E23;
  font-weight: 500;
}
```

---

## 5. 本周运势趋势

### WXML
```html
<!-- 本周运势趋势 -->
<view class="weekly-section card">
  <view class="card-header-row">
    <text class="card-title">本周趋势</text>
    <text class="card-subtitle">{{weeklyTrend.weekRange}}</text>
  </view>
  
  <!-- 柱状图 -->
  <view class="weekly-chart">
    <view class="chart-bar-group" wx:for="{{weeklyTrend.dailyScores}}" wx:key="date">
      <view class="chart-bar-wrapper">
        <view class="chart-bar" style="height: {{item.score}}%; background: {{item.isToday ? '#C6A062' : '#E8E4DE'}}">
          <text class="bar-score" wx:if="{{item.score >= 60}}">{{item.score}}</text>
        </view>
        <text class="bar-score-below" wx:if="{{item.score < 60}}">{{item.score}}</text>
      </view>
      <text class="chart-day {{item.isToday ? 'today' : ''}}">{{item.day}}</text>
      <view class="chart-label" wx:if="{{item.label}}">
        <text class="label-icon">{{item.label}}</text>
      </view>
    </view>
  </view>
  
  <!-- 关键日期 -->
  <view class="key-dates">
    <view class="key-date-item" wx:for="{{weeklyTrend.keyDates}}" wx:key="date">
      <view class="key-date-badge">
        <text class="key-date-icon">{{item.label}}</text>
        <text class="key-date-day">{{item.day}}</text>
      </view>
      <text class="key-date-reason">{{item.reason}}</text>
    </view>
  </view>
  
  <!-- 本周总结 -->
  <view class="weekly-summary">
    <text class="summary-content">{{weeklyTrend.weeklyTrend}}</text>
  </view>
</view>
```

### WXSS
```css
.weekly-section {
  background: var(--paper-50);
  border: 1rpx solid var(--paper-200);
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
}

.weekly-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200rpx;
  padding: 0 16rpx;
  margin-bottom: 32rpx;
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.chart-bar-wrapper {
  height: 160rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

.chart-bar {
  width: 32rpx;
  border-radius: 8rpx 8rpx 0 0;
  min-height: 8rpx;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: height 0.4s ease-out;
}

.bar-score {
  font-size: 18rpx;
  color: var(--paper-50);
  font-weight: 600;
  margin-top: 8rpx;
}

.bar-score-below {
  font-size: 18rpx;
  color: #7A746B;
  font-weight: 600;
  margin-top: 4rpx;
}

.chart-day {
  font-size: 22rpx;
  color: #7A746B;
  margin-top: 12rpx;
}

.chart-day.today {
  color: #C6A062;
  font-weight: 700;
}

.chart-label {
  position: absolute;
  top: -8rpx;
}

.label-icon {
  font-size: 24rpx;
}

.key-dates {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 24rpx;
  background: var(--paper-100);
  border-radius: 20rpx;
  margin-bottom: 24rpx;
}

.key-date-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.key-date-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: var(--paper-50);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  border: 1rpx solid var(--paper-200);
  min-width: 100rpx;
}

.key-date-icon {
  font-size: 20rpx;
}

.key-date-day {
  font-size: 22rpx;
  font-weight: 600;
  color: var(--star-50);
}

.key-date-reason {
  font-size: 24rpx;
  color: #4A4540;
  flex: 1;
  line-height: 1.4;
}

.weekly-summary {
  padding-top: 16rpx;
  border-top: 1rpx solid var(--paper-200);
}

.summary-content {
  font-size: 26rpx;
  color: #4A4540;
  line-height: 1.7;
}
```

---

## 6. 能量标签配色（JS 常量）

```javascript
const ENERGY_COLORS = {
  '积极': { 
    label: '积极', 
    dotColor: 'var(--accent)', 
    tagBg: 'var(--paper-200)', 
    tagColor: 'var(--warm-brown)' 
  },
  '平稳': { 
    label: '平稳', 
    dotColor: 'var(--success)', 
    tagBg: 'var(--paper-200)', 
    tagColor: 'var(--success)' 
  },
  '放松': { 
    label: '放松', 
    dotColor: 'var(--paper-400)', 
    tagBg: 'var(--paper-200)', 
    tagColor: 'var(--paper-400)' 
  },
  '挑战': { 
    label: '挑战', 
    dotColor: 'var(--danger)', 
    tagBg: 'var(--paper-200)', 
    tagColor: 'var(--danger)' 
  }
};
```

---

## 模块顺序总结

按照渐进式信息呈现，页面模块顺序如下：

### 快速浏览层（首屏）
1. 今日运势概览卡片
2. 四维度评分
3. 今日宜忌
4. 时间窗口

### 深度解读层（滚动可见）
5. 四维度详细解读（点击展开）
6. 今日星象深度分析
7. 行运星盘可视化
8. 相位矩阵分析

### 趋势预览层（底部）
9. 本周运势趋势
