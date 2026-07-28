# Tasks: Wiki 百科静态数据完善与前端永久缓存

## Phase 1: 前端缓存机制实现

### Task 1.1: 添加 Wiki 永久缓存逻辑
- **文件**: `services/apiClient.ts`
- **内容**:
  - 添加缓存版本常量 `WIKI_CACHE_VERSION`
  - 为 `fetchWikiItems` 添加 localStorage 缓存
  - 为 `fetchWikiItem` 添加 localStorage 缓存
  - 保持 `fetchWikiSearch` 不缓存（动态查询）

### Task 1.2: 添加缓存清理工具
- **文件**: `services/apiClient.ts`
- **内容**:
  - 导出 `clearWikiCache()` 函数供手动清理
  - 可选：在设置页面添加清理按钮

## Phase 2: 行星条目内容补全（7条）

### Task 2.1: 补全太阳 Sun
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration, deep_dive

### Task 2.2: 补全月亮 Moon
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration, deep_dive

### Task 2.3: 补全水星 Mercury
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration, deep_dive

### Task 2.4: 补全金星 Venus
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration, deep_dive

### Task 2.5: 补全火星 Mars
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration, deep_dive

### Task 2.6: 补全木星 Jupiter
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration, deep_dive

### Task 2.7: 补全天王星/海王星/冥王星 (Uranus, Neptune, Pluto)
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration, deep_dive

## Phase 3: 星座条目内容补全（11条）

### Task 3.1: 补全白羊座 Aries
### Task 3.2: 补全金牛座 Taurus
### Task 3.3: 补全双子座 Gemini
### Task 3.4: 补全巨蟹座 Cancer
### Task 3.5: 补全狮子座 Leo
### Task 3.6: 补全处女座 Virgo
### Task 3.7: 补全天秤座 Libra
### Task 3.8: 补全射手座 Sagittarius
### Task 3.9: 补全摩羯座 Capricorn
### Task 3.10: 补全水瓶座 Aquarius
### Task 3.11: 补全双鱼座 Pisces

每个任务内容相同：
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration, deep_dive

## Phase 4: 宫位条目内容补全（11条）

### Task 4.1-4.11: 补全第2-12宫
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration
- **注意**: 宫位内容相对简短，可批量处理

## Phase 5: 相位条目内容补全（4条）

### Task 5.1: 补全对分相 Opposition
### Task 5.2: 补全三分相 Trine
### Task 5.3: 补全四分相 Square
### Task 5.4: 补全六分相 Sextile

每个任务内容相同：
- **文件**: `backend/src/data/wiki.ts`
- **内容**: astronomy_myth, psychology, shadow, integration

## Phase 6: 测试与验证

### Task 6.1: 验证缓存机制
- 测试首次加载后缓存写入
- 测试二次加载从缓存读取
- 测试缓存版本更新后失效

### Task 6.2: 验证内容显示
- 检查所有条目在详情页正确显示
- 检查中英文切换正常
- 检查无占位符内容残留

## 依赖关系

```
Phase 1 (缓存机制) ──┐
                    ├─── Phase 6 (测试验证)
Phases 2-5 (内容) ──┘
```

Phase 1 和 Phases 2-5 可并行进行，Phase 6 需等待前面完成。

## 估算工作量

| Phase | 任务数 | 预估 |
|-------|-------|------|
| Phase 1 | 2 | 小 |
| Phase 2 | 7 | 中 |
| Phase 3 | 11 | 大 |
| Phase 4 | 11 | 中 |
| Phase 5 | 4 | 小 |
| Phase 6 | 2 | 小 |

总计：约 37 个子任务
