<!-- INPUT: CBT 服务目录结构与职责说明（后端代理与单语言 snake_case 输出）。 -->
<!-- OUTPUT: CBT 服务目录文档。 -->
<!-- POS: CBT 服务目录说明；若更新此文件，务必更新本头注释。 -->

# services/cbt/

CBT 功能的后端代理服务层。

## 文件清单

| 文件 | 职责 |
|------|------|
| `deepseekService.ts` | 调用后端 CBT 分析接口，返回 snake_case 报告并上抛失败 |

## 环境变量

- `VITE_API_BASE_URL`：后端 API 地址（可选，默认 `http://localhost:3001/api`）

## 依赖

- `components/cbt/types.ts`：CBT 数据类型（snake_case）
