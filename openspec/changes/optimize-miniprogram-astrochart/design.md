# 设计文档：小程序星盘组件优化

## 1. 架构概述

### 1.1 组件结构

```
astromind/miniprogram/
├── components/
│   └── astro-chart/
│       ├── astro-chart.js      # 主组件逻辑（Canvas 绑定）
│       ├── astro-chart.wxml    # 模板（Canvas + 详情卡片）
│       ├── astro-chart.wxss    # 样式
│       ├── astro-chart.json    # 组件配置
│       └── chart-utils.js      # 工具函数
├── constants/
│   └── chart-config.js         # 配置常量
└── pages/
    ├── self/                   # 本命盘
    ├── daily/                  # 行运盘
    ├── chart/                  # 专业排盘
    └── discovery/              # 合盘
```

### 1.2 数据流

```
页面数据 (positions, aspects, houseCusps)
    │
    v
astro-chart 组件
    │
    ├── processPlanets() → 计算绝对角度
    ├── spreadPlanets() → 防重叠算法
    ├── filterPlanets() → 过滤显示天体
    └── calculateAspects() → 计算相位
    │
    v
Canvas 2D 绑定
    │
    ├── drawZodiacWheel() → 黄道带轮盘
    ├── drawHouseCusps() → 宫位线
    ├── drawHouseCuspLabels() → 宫头标注 [新增]
    ├── drawAspects() → 相位线
    └── drawPlanets() → 行星信息 [增强]
    │
    v
点击交互
    │
    └── showPlanetDetail() → 详情卡片 [增强]
```

## 2. 几何布局设计

### 2.1 坐标系统

- **Web 版本**：SVG viewBox 400×400，中心点 (200, 200)
- **小程序版本**：Canvas 动态尺寸，中心点 (width/2, height/2)
- **缩放比例**：所有半径值按 `Math.min(cx, cy) / 200` 缩放

### 2.2 单盘布局参数

| 参数 | Web 值 | 小程序值（相对） | 说明 |
|------|--------|------------------|------|
| R_OUTER_RIM | 198 | 0.99 | 最外圆边框 |
| ZODIAC_BAND_WIDTH | 21 | 0.105 | 星座环宽度 |
| R_ZODIAC_INNER | 177 | 0.885 | 星座环内径 |
| R_PLANET_RING | 168 | 0.84 | 行星符号环 |
| R_POSITION_INFO | 130 | 0.65 | 位置信息中心 |
| R_HOUSE_RING | 75 | 0.375 | 宫位分隔线 |
| R_HOUSE_NUMBERS | 62 | 0.31 | 宫位数字环 |
| R_ASPECT_LINE | 57 | 0.285 | 相位线半径 |
| R_INNER_HUB | 25 | 0.125 | 中心点 |

### 2.3 双盘布局参数

| 参数 | Web 值 | 小程序值（相对） | 说明 |
|------|--------|------------------|------|
| R_PLANET_RING_OUTER | 168 | 0.84 | 外环行星 |
| R_SEPARATOR | 125 | 0.625 | 内外环分隔线 |
| R_PLANET_RING_INNER | 118 | 0.59 | 内环行星 |
| R_HOUSE_RING_DUAL | 72 | 0.36 | 宫位分隔线 |
| R_HOUSE_NUMBERS_DUAL | 58 | 0.29 | 宫位数字环 |
| R_ASPECT_LINE_DUAL | 54 | 0.27 | 相位线半径 |

### 2.4 行星位置信息径向排列

**单盘布局**（从外到内）：
```
r1 = R_PLANET_RING (0.84)      → 行星符号 (14px)
r2 = r1 - 18px                  → 度数 (11px)
r3 = r2 - 18px                  → 星座符号 (12px)
r4 = r3 - 14px                  → 角分 (9px)
r5 = r4 - 12px                  → 逆行标记 (8px)
```

**双盘布局**（外环/内环各自缩放 90%）：
```
外环：
r1 = R_PLANET_RING_OUTER (0.84) → 行星符号 (11px)
r2 = r1 - 11px                   → 度数 (8px)
r3 = r2 - 11px                   → 星座符号 (9px)
r4 = r3 - 9px                    → 角分 (6px)
r5 = r4 - 7px                    → 逆行标记 (5px)

内环：
r1 = R_PLANET_RING_INNER (0.59) → 行星符号 (11px)
r2 = r1 - 11px                   → 度数 (8px)
r3 = r2 - 11px                   → 星座符号 (9px)
r4 = r3 - 9px                    → 角分 (6px)
r5 = r4 - 7px                    → 逆行标记 (5px)
```

## 3. 绘制逻辑设计

### 3.1 行星位置信息绘制

```javascript
drawPlanetInfo(ctx, cx, cy, planet, rotation, config) {
  const { visualAngle, absAngle, degree, minute, sign, isRetrograde } = planet;
  const meta = PLANET_META[planet.name];
  const signMeta = SIGN_META[sign];

  // 计算各元素位置
  const displayAngle = toRenderAngle(visualAngle) - rotation;
  const actualAngle = toRenderAngle(absAngle) - rotation;

  // 径向排列位置
  const r1 = config.planetRing;
  const r2 = r1 - config.spacing;
  const r3 = r2 - config.spacing;
  const r4 = r3 - config.smallSpacing;
  const r5 = r4 - config.smallSpacing;

  const pos1 = getCoords(displayAngle, r1, cx, cy);
  const pos2 = getCoords(displayAngle, r2, cx, cy);
  const pos3 = getCoords(displayAngle, r3, cx, cy);
  const pos4 = getCoords(displayAngle, r4, cx, cy);
  const pos5 = getCoords(displayAngle, r5, cx, cy);

  // 绘制偏移连接线（当有偏移时）
  if (Math.abs(angleDiff(visualAngle, absAngle)) > 0.5) {
    const zodiacPos = getCoords(actualAngle, config.zodiacInner, cx, cy);
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(pos1.x, pos1.y);
    ctx.lineTo(zodiacPos.x, zodiacPos.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
  }

  // 绘制行星符号
  ctx.save();
  ctx.translate(pos1.x, pos1.y);
  ctx.rotate(-rotation * Math.PI / 180); // 保持水平
  ctx.fillStyle = meta.color;
  ctx.font = `bold ${config.planetFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.glyph, 0, 0);
  ctx.restore();

  // 绘制度数
  ctx.save();
  ctx.translate(pos2.x, pos2.y);
  ctx.rotate(-rotation * Math.PI / 180);
  ctx.fillStyle = '#E8E4DC';
  ctx.font = `600 ${config.degreeFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.floor(degree)}°`, 0, 0);
  ctx.restore();

  // 绘制星座符号
  ctx.save();
  ctx.translate(pos3.x, pos3.y);
  ctx.rotate(-rotation * Math.PI / 180);
  ctx.fillStyle = signMeta.color;
  ctx.font = `bold ${config.signFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(signMeta.glyph, 0, 0);
  ctx.restore();

  // 绘制角分
  ctx.save();
  ctx.translate(pos4.x, pos4.y);
  ctx.rotate(-rotation * Math.PI / 180);
  ctx.fillStyle = '#A09A90';
  ctx.font = `${config.minuteFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${minute || 0}'`, 0, 0);
  ctx.restore();

  // 绘制逆行标记
  if (isRetrograde) {
    ctx.save();
    ctx.translate(pos5.x, pos5.y);
    ctx.rotate(-rotation * Math.PI / 180);
    ctx.fillStyle = '#CD5C5C';
    ctx.font = `600 ${config.retroFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R', 0, 0);
    ctx.restore();
  }

  // 保存点击区域
  this.clickAreas.push({
    x: pos1.x,
    y: pos1.y,
    radius: 15, // 扩大触摸区域
    planet: { ...planet, glyph: meta.glyph, color: meta.color },
  });
}
```

### 3.2 宫头标注绘制

```javascript
drawHouseCuspLabels(ctx, cx, cy, houseCusps, rotation) {
  if (!houseCusps || houseCusps.length !== 12) return;

  const baseRadius = Math.min(cx, cy);
  const iconRadius = baseRadius * 0.885 + (baseRadius * 0.105 / 2); // 星座环中心

  houseCusps.forEach((cuspLongitude, i) => {
    const normalizedLongitude = normalizeAngle(cuspLongitude);
    let signIndex = Math.floor(normalizedLongitude / 30);
    const degreeFloat = normalizedLongitude % 30;
    let degreeInSign = Math.floor(degreeFloat);
    let minute = Math.round((degreeFloat - degreeInSign) * 60);

    if (minute === 60) {
      minute = 0;
      degreeInSign += 1;
      if (degreeInSign >= 30) {
        degreeInSign = 0;
        signIndex = (signIndex + 1) % 12;
      }
    }

    const signName = SIGN_NAMES[signIndex];
    const signMeta = SIGN_META[signName];
    const angle = toChartAngle(cuspLongitude, rotation);

    // 星座符号位置
    const iconPos = getCoords(angle, iconRadius, cx, cy);

    // 判断文字方向
    const normalizedAngle = normalizeAngle(angle);
    const isLeftSide = normalizedAngle > 135 && normalizedAngle < 225;
    const isRightSide = normalizedAngle > 315 || normalizedAngle < 45;
    const isSideArea = isLeftSide || isRightSide;

    // 度数和分钟沿切线方向排布
    const labelOffset = 12;
    const tangentAngle = angle + 90;
    const firstPos = getCoords(tangentAngle, labelOffset, iconPos.x, iconPos.y);
    const secondPos = getCoords(tangentAngle + 180, labelOffset, iconPos.x, iconPos.y);

    const [degreePos, minutePos] = isSideArea
      ? (firstPos.y <= secondPos.y ? [firstPos, secondPos] : [secondPos, firstPos])
      : (firstPos.x <= secondPos.x ? [firstPos, secondPos] : [secondPos, firstPos]);

    // 绘制度数
    ctx.fillStyle = '#E8E4DC';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(degreeInSign.toString(), degreePos.x, degreePos.y);

    // 绘制星座符号
    ctx.fillStyle = signMeta.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(signMeta.glyph, iconPos.x, iconPos.y);

    // 绘制分钟
    ctx.fillStyle = '#A09A90';
    ctx.font = '7px sans-serif';
    ctx.fillText(String(minute).padStart(2, '0'), minutePos.x, minutePos.y);
  });
}
```

### 3.3 相位线分层渲染

```javascript
drawAspects(ctx, cx, cy, aspects, innerPlanets, outerPlanets, rotation, config) {
  // 按层级分组
  const layers = { foreground: [], midground: [], background: [] };

  aspects.forEach(aspect => {
    const layer = getAspectLayer(aspect, config);
    layers[layer].push(aspect);
  });

  // 按层级绘制（背景 → 中景 → 前景）
  ['background', 'midground', 'foreground'].forEach(layer => {
    const style = VISUAL_LAYER_STYLES[layer];

    layers[layer].forEach(aspect => {
      if (aspect.type === 'conjunction') return;

      const allPlanets = [...innerPlanets, ...outerPlanets];
      const p1 = allPlanets.find(p => p.name === aspect.planet1);
      const p2 = allPlanets.find(p => p.name === aspect.planet2);
      if (!p1 || !p2) return;

      // 判断是否为跨盘相位
      const isCrossAspect = (innerPlanets.includes(p1) && outerPlanets.includes(p2)) ||
                           (innerPlanets.includes(p2) && outerPlanets.includes(p1));

      const radius = isCrossAspect ? config.aspectRadiusOuter : config.aspectRadiusInner;
      const coords1 = getCoords(p1.visualAngle - rotation, radius, cx, cy);
      const coords2 = getCoords(p2.visualAngle - rotation, radius, cx, cy);

      ctx.strokeStyle = ASPECT_COLORS[aspect.type];
      ctx.globalAlpha = style.opacity;
      ctx.lineWidth = style.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(coords1.x, coords1.y);
      ctx.lineTo(coords2.x, coords2.y);
      ctx.stroke();
    });
  });

  ctx.globalAlpha = 1.0;
}
```

## 4. 行星详情卡片设计

### 4.1 卡片结构

```wxml
<!-- 行星详情卡片 -->
<view class="planet-detail-card"
      wx:if="{{selectedPlanet}}"
      style="left: {{detailCardX}}px; top: {{detailCardY}}px;">

  <!-- 关闭按钮 -->
  <view class="card-close" bindtap="closePlanetDetail">×</view>

  <!-- 行星标识区 -->
  <view class="card-header">
    <text class="planet-glyph" style="color: {{selectedPlanet.color}}">
      {{selectedPlanet.glyph}}
    </text>
    <view class="planet-info">
      <view class="planet-name-row">
        <text class="planet-name" style="color: {{selectedPlanet.color}}">
          {{selectedPlanet.displayName}}
        </text>
        <text class="planet-badge">
          {{selectedPlanet.isRetrograde ? '逆行' : '顺行'}}
        </text>
      </view>
      <text class="planet-keywords">{{selectedPlanet.keywords}}</text>
    </view>
  </view>

  <!-- 星座位置区 -->
  <view class="card-section">
    <text class="section-label">星座位置</text>
    <view class="section-row">
      <text>位于</text>
      <text class="sign-name" style="color: {{selectedPlanet.signColor}}">
        {{selectedPlanet.signName}}
      </text>
      <text class="sign-glyph" style="color: {{selectedPlanet.signColor}}">
        {{selectedPlanet.signGlyph}}
      </text>
      <text>{{selectedPlanet.degree}}°{{selectedPlanet.minute}}'</text>
    </view>
  </view>

  <!-- 宫位信息区 -->
  <view class="card-section" wx:if="{{selectedPlanet.house}}">
    <text class="section-label">宫位信息</text>
    <view class="section-row">
      <text>位于</text>
      <text class="house-num">{{selectedPlanet.house}}</text>
      <text>宫</text>
      <block wx:if="{{selectedPlanet.ruledHouses.length > 0}}">
        <text class="divider">|</text>
        <text>守护</text>
        <text class="house-num">{{selectedPlanet.ruledHouses}}</text>
        <text>宫</text>
      </block>
    </view>
  </view>

  <!-- 相位列表区 -->
  <view class="card-section" wx:if="{{selectedPlanet.aspects.length > 0}}">
    <text class="section-label">主要相位</text>
    <view class="aspect-list">
      <view class="aspect-row" wx:for="{{selectedPlanet.aspects}}" wx:key="index">
        <text>与</text>
        <text class="other-planet" style="color: {{item.otherColor}}">
          {{item.otherName}}
        </text>
        <text class="other-glyph" style="color: {{item.otherColor}}">
          {{item.otherGlyph}}
        </text>
        <text>成</text>
        <text class="aspect-angle" style="color: {{item.aspectColor}}">
          {{item.angle}}°
        </text>
        <text class="aspect-symbol" style="color: {{item.aspectColor}}">
          {{item.aspectSymbol}}
        </text>
        <text class="aspect-orb">{{item.orb}}°</text>
      </view>
    </view>
  </view>
</view>
```

### 4.2 卡片样式

```wxss
.planet-detail-card {
  position: fixed;
  width: 280px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  animation: fadeIn 200ms ease-out;
}

.card-close {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.planet-glyph {
  font-size: 28px;
  line-height: 1;
  font-family: 'Segoe UI Symbol', sans-serif;
}

.planet-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.planet-name {
  font-size: 16px;
  font-weight: 600;
}

.planet-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.08);
  color: #64748b;
}

.planet-keywords {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.card-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.section-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
  display: block;
}

.section-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #1e293b;
}

.sign-name, .sign-glyph {
  font-weight: 500;
}

.house-num {
  font-weight: 600;
}

.divider {
  margin: 0 8px;
  color: #94a3b8;
}

.aspect-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #475569;
  margin-top: 6px;
}

.aspect-orb {
  color: #94a3b8;
  margin-left: 4px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 4.3 交互逻辑

```javascript
// 显示行星详情
showPlanetDetail(planet, x, y) {
  // 获取相关相位
  const relevantAspects = this.getRelevantAspects(planet);

  // 获取守护宫位
  const ruledHouses = this.getRuledHouses(planet.name);

  // 获取星座信息
  const signMeta = SIGN_META[planet.sign];

  // 计算卡片位置（避免超出屏幕）
  const systemInfo = wx.getSystemInfoSync();
  const cardWidth = 280;
  const cardHeight = 300; // 估计高度

  let cardX = x + 15;
  let cardY = y - 50;

  if (cardX + cardWidth > systemInfo.windowWidth) {
    cardX = x - cardWidth - 15;
  }
  if (cardY + cardHeight > systemInfo.windowHeight) {
    cardY = systemInfo.windowHeight - cardHeight - 20;
  }
  if (cardY < 10) cardY = 10;
  if (cardX < 10) cardX = 10;

  this.setData({
    selectedPlanet: {
      ...planet,
      displayName: this.getPlanetDisplayName(planet.name),
      keywords: PLANET_META[planet.name]?.keywords || '',
      signName: this.getSignDisplayName(planet.sign),
      signGlyph: signMeta?.glyph || '',
      signColor: signMeta?.color || '#888',
      ruledHouses: ruledHouses.join(', '),
      aspects: relevantAspects.slice(0, 5).map(a => ({
        otherName: this.getPlanetDisplayName(a.otherPlanet),
        otherGlyph: PLANET_META[a.otherPlanet]?.glyph || '',
        otherColor: PLANET_META[a.otherPlanet]?.color || '#888',
        angle: ASPECT_ANGLES[a.type],
        aspectSymbol: ASPECT_SYMBOLS[a.type],
        aspectColor: ASPECT_COLORS[a.type],
        orb: Math.abs(a.orb).toFixed(0),
      })),
    },
    detailCardX: cardX,
    detailCardY: cardY,
  });
}

// 获取相关相位
getRelevantAspects(planet) {
  const { aspects } = this.data;
  if (!aspects) return [];

  return aspects
    .filter(a => a.planet1 === planet.name || a.planet2 === planet.name)
    .map(a => ({
      ...a,
      otherPlanet: a.planet1 === planet.name ? a.planet2 : a.planet1,
    }))
    .sort((a, b) => Math.abs(a.orb) - Math.abs(b.orb));
}
```

## 5. 性能优化策略

### 5.1 减少重绘

- 使用 `observers` 监听数据变化，避免不必要的重绘
- 缓存计算结果（行星位置、相位等）
- 使用 `requestAnimationFrame` 节流绘制

### 5.2 Canvas 优化

- 批量绘制同类元素（先绘制所有线条，再绘制所有文字）
- 减少 `ctx.save()` / `ctx.restore()` 调用
- 使用 `Path2D` 缓存复杂路径

### 5.3 内存管理

- 及时清理点击区域数组
- 避免在绘制循环中创建新对象
- 使用对象池复用临时对象

## 6. 兼容性处理

### 6.1 字体回退

```javascript
// 检测 Unicode 符号支持
const testUnicodeSupport = () => {
  // 在 Canvas 上测试绘制 Unicode 符号
  // 如果宽度为 0 或异常，使用 SVG Path 回退
};

// 绘制行星符号
const drawPlanetGlyph = (ctx, x, y, planet) => {
  const meta = PLANET_META[planet.name];
  const pathData = PLANET_SVG_PATHS[planet.name];

  if (pathData && this.canvas.createPath2D) {
    // 使用 SVG Path
    const path = this.canvas.createPath2D(pathData);
    ctx.fill(path);
  } else {
    // 使用 Unicode 符号
    ctx.fillText(meta.glyph, x, y);
  }
};
```

### 6.2 DPR 处理

```javascript
initCanvas() {
  const dpr = wx.getSystemInfoSync().pixelRatio;
  canvas.width = this.data.width * dpr;
  canvas.height = this.data.height * dpr;
  ctx.scale(dpr, dpr);
}
```

## 7. 测试要点

### 7.1 视觉测试

- [ ] 单盘行星信息完整显示
- [ ] 双盘内外环清晰分离
- [ ] 宫头标注正确显示
- [ ] 相位线分层效果明显
- [ ] 颜色与 Web 版本一致

### 7.2 交互测试

- [ ] 点击行星显示详情卡片
- [ ] 卡片位置自适应
- [ ] 点击空白处关闭卡片
- [ ] 相位信息正确显示

### 7.3 性能测试

- [ ] 页面滚动流畅
- [ ] 星盘绘制无延迟
- [ ] 内存占用稳定
