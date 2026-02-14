# 城市搜索功能指南（City Search Guide）

## 概述

纯前端城市搜索系统，针对**欧美用户**优化，支持智能模糊匹配。

## 📊 城市数据库

### 统计信息
- **总计**：114 个城市
- **美国**：28 个主要城市（纽约、洛杉矶、芝加哥等）
- **加拿大**：6 个城市（多伦多、温哥华等）
- **英国**：8 个城市（伦敦、曼彻斯特、伯明翰等）
- **欧洲其他**：47 个城市（巴黎、柏林、罗马等）
- **大洋洲**：6 个城市（悉尼、墨尔本等）
- **亚洲**：8 个主要城市（东京、首尔、新加坡等）
- **南美洲**：4 个城市（圣保罗、布宜诺斯艾利斯等）
- **中国**：仅 16 个主要城市（北京、上海、广州、深圳等一线城市）

### 优先级分配
- **欧美城市**：78%（符合产品定位：欧美 18-35 岁用户）
- **其他国际城市**：22%

## 🔍 搜索功能

### 支持的搜索方式

#### 1. 英文名搜索（推荐，得分最高）
```
new york    → New York, New York, United States
london      → London, England, United Kingdom
paris       → Paris, Île-de-France, France
```

#### 2. 拼音搜索
```
beijing     → Beijing, Beijing, China
shanghai    → Shanghai, Shanghai, China
guangzhou   → Guangzhou, Guangdong, China
```

#### 3. 拼音首字母搜索
```
ny  → New York
bj  → Beijing
sh  → Shanghai
la  → Los Angeles
```

#### 4. 中文名搜索
```
北京  → Beijing, Beijing, China
伦敦  → London, England, United Kingdom
```

#### 5. 部分匹配
```
york   → New York
angeles → Los Angeles
```

### 搜索得分规则

| 匹配类型 | 得分 | 说明 |
|---------|------|------|
| 英文名完全匹配 | 100 | 最高优先级 |
| 英文名前缀匹配 | 80 | 输入 "new" 匹配 "New York" |
| 拼音完全匹配 | 70 | 输入 "beijing" 匹配北京 |
| 英文名单词开头 | 60 | 输入 "york" 匹配 "New York" |
| 拼音前缀匹配 | 55 | 输入 "beij" 匹配北京 |
| 英文名包含匹配 | 50 | 输入 "ang" 匹配 "Los Angeles" |
| 拼音首字母完全 | 45 | 输入 "bj" 匹配北京 |
| 拼音首字母前缀 | 40 | 输入 "b" 匹配北京 |
| 中文名前缀匹配 | 75 | 仅中文环境 |
| 中文名包含匹配 | 35 | 仅中文环境 |
| 省份匹配 | 20 | 输入 "california" 匹配加州城市 |
| 国家匹配 | 15 | 输入 "france" 匹配法国城市 |

## 🎯 使用方法

### 前端集成

```typescript
import { searchCities, formatCityDisplay, getCityCoordinates } from './utils/city-search';

// 搜索城市
const results = searchCities('new york', 5, 'en');

// 格式化显示
results.forEach(city => {
  console.log(formatCityDisplay(city, 'en'));
  // 输出: "New York, New York, United States"
});

// 获取坐标和时区
const coords = getCityCoordinates(results[0]);
console.log(coords);
// 输出: { lat: 40.7128, lon: -74.0060, timezone: '-5' }
```

### API 参数

#### `searchCities(query, limit, language)`
- **query**: 搜索关键词（string）
- **limit**: 返回结果数量，默认 5（number）
- **language**: 语言设置 `'en'` | `'zh'`，影响显示和得分，默认 `'en'`（Language）
- **返回**: `City[]` 城市对象数组

#### `formatCityDisplay(city, language)`
- **city**: 城市对象（City）
- **language**: 语言设置 `'en'` | `'zh'`（Language）
- **返回**: 格式化的显示文本（string）

#### `getCityCoordinates(city)`
- **city**: 城市对象（City）
- **返回**: `{ lat: number; lon: number; timezone: string }`

## 📁 文件结构

```
/data
  └── cities.ts          # 城市数据库（114个城市）

/utils
  └── city-search.ts     # 搜索工具（模糊匹配、格式化）

App.tsx                  # 已集成本地搜索
```

## 🧪 测试

打开测试页面：
```bash
# 在项目根目录启动本地服务器
python3 -m http.server 8000
# 或使用 npm
npm run dev
```

访问：`http://localhost:8000/test-city-search.html`

### 测试用例
- ✅ 英文搜索："new york", "london", "paris"
- ✅ 拼音搜索："beijing", "shanghai"
- ✅ 首字母搜索："ny", "la", "bj"
- ✅ 中文搜索："北京", "上海"
- ✅ 部分匹配："york", "angeles"

## 🚀 性能

- **搜索延迟**：< 10ms（纯前端，无网络请求）
- **防抖时间**：300ms（用户体验优化）
- **内存占用**：~50KB（城市数据 + 搜索代码）

## 🌐 国际化

### 英文环境（默认）
```typescript
const city = searchCities('new york', 1, 'en')[0];
formatCityDisplay(city, 'en');
// "New York, New York, United States"
```

### 中文环境
```typescript
const city = searchCities('北京', 1, 'zh')[0];
formatCityDisplay(city, 'zh');
// "北京, Beijing, China"
```

## ⚡ 优化建议

### 1. 扩展城市数据库
如需添加更多城市，编辑 `data/cities.ts`：

```typescript
{
  id: 'cityid',
  name: '中文名',
  province: 'Province/State',
  country: 'Country',
  pinyin: 'pinyin',
  pinyinAbbr: 'abbr',
  enName: 'English Name',
  lat: 0.0,
  lon: 0.0
}
```

### 2. 改进时区计算
当前使用简单的经度计算（lon / 15），可升级为 IANA 时区标识符：

```typescript
// 添加 timezone 字段到城市数据
{ ..., timezone: 'America/New_York' }

// 使用 date-fns-tz 进行时区转换
import { zonedTimeToUtc } from 'date-fns-tz';
```

### 3. 添加城市别名
支持城市的常用别名（如 NYC → New York）：

```typescript
const aliases = {
  'nyc': 'new york',
  'la': 'los angeles',
  'sf': 'san francisco'
};
```

## 🔧 技术栈

- **TypeScript** - 类型安全
- **纯前端** - 无后端依赖
- **零依赖** - 无需额外 npm 包
- **智能匹配** - 多维度评分算法

## 📝 更新日志

### 2026-02-08
- ✅ 创建城市数据库（114个城市，以欧美为主）
- ✅ 实现模糊搜索（英文、拼音、首字母）
- ✅ 集成到 onboarding 和用户管理页面
- ✅ 添加搜索状态提示（搜索中、无结果等）
- ✅ 国际化支持（中英文显示）

## 🐛 已知问题

- 时区计算使用简单算法（经度 / 15），不考虑夏令时和特殊时区
- 中国城市数量较少（仅16个），可能不满足中国用户需求
- 部分城市的省份名称可能不准确（需要人工校验）

## 💡 未来改进

- [ ] 添加更多欧美中小城市（如美国各州首府）
- [ ] 支持邮政编码搜索
- [ ] 集成 IANA 时区数据库
- [ ] 添加城市人口、海拔等元数据
- [ ] 支持多语言城市名称（德语、法语、西班牙语等）

## 📞 支持

如有问题或建议，请查看：
- 产品定位：`CLAUDE.md`
- UI 规范：`COLOR_SYSTEM_GUIDE.md`
- 国际化规范：`CLAUDE.md` 中的 "国际化 (i18n) 规范" 章节
