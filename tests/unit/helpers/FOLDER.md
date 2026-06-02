<!-- INPUT: 被测模块 / 测试构造的 analytics payload 等数据结构。 -->
<!-- OUTPUT: 跨测试复用的断言工具（如 assertNoPii），供 tests/unit 下多个测试 import。 -->
<!-- POS: tests/unit 共享测试 helper 目录。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

# tests/unit/helpers

tests/unit 下的共享测试断言 / 工具集合。集中放可复用的断言函数，避免各测试文件各造一套（§3.2 去重要求：#10 / #12 / #24 共用同一套 PII 断言）。

## 文件清单

| 文件 | 职责 |
|---|---|
| `assertNoPii.ts` | 导出 `PII_KEYS` 列表与 `assertNoPii(payload)` 断言函数：递归（含嵌套对象/数组）检查 analytics payload 不含任何 PII 键（question/situation/birth*/name*/lat/lon 等），命中则抛错列出键路径。守护隐私红线 #1。 |
