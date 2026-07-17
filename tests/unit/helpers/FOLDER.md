<!-- INPUT: 被测模块 / 测试构造的 analytics payload、timeline 蜡烛与 marker 等数据结构。 -->
<!-- OUTPUT: 跨测试复用的断言与工厂工具（assertNoPii、lifekline 域的 polyfill/蜡烛/marker 工厂），供 tests/unit 下多个测试 import。 -->
<!-- POS: tests/unit 共享测试 helper 目录。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

# tests/unit/helpers

tests/unit 下的共享测试断言 / 工具集合。集中放可复用的断言函数与测试工厂，避免各测试文件各造一套（§3.2 去重要求：#10 / #12 / #24 共用同一套 PII 断言；lifekline 三测试共用同一套蜡烛工厂）。

## 文件清单

| 文件 | 职责 |
|---|---|
| `assertNoPii.ts` | 导出 `PII_KEYS` 列表与 `assertNoPii(payload)` 断言函数：递归（含嵌套对象/数组）检查 analytics payload 不含任何 PII 键（question/situation/birth*/name*/lat/lon 等），命中则抛错列出键路径。守护隐私红线 #1。 |
| `lifekline.ts` | lifekline 域共享工厂：`installPointerEventPolyfill`（jsdom 缺 PointerEvent 时以 MouseEvent 为底补齐，幂等）、`makeAspect`、`makeCandle`（首参 age 或 date）、`makeLifeCandles`（100 根 age 0-99，可按年注入 topAspects）、`makeLifeMarkers`（SR@29 + Uranus opp@42）。供 `lifekline-section` / `timeline-page-life` / `lifekline-derived` 三测试复用。 |
