<!-- INPUT: Astrodienst 发布的 Swiss Ephemeris 二进制星历数据文件（随 npm 包 swisseph 分发）。 -->
<!-- OUTPUT: 供 services/ephemeris.ts 在启动时通过 swe_set_ephe_path() 加载的星历数据。 -->
<!-- POS: 星历数据资产目录；若更新此目录，务必更新本文件与 backend/FOLDER.md。 -->

# backend/ephe/

Swiss Ephemeris 的二进制星历数据文件。**这是运行时必需的数据资产，不是可选优化。**

## 为什么要提交进仓库

Swiss Ephemeris 的小行星位置（Chiron / Ceres / Pallas / Juno / Vesta）**必须**读 `seas_*.se1`
才能计算；主行星有内置的 Moshier 解析理论兜底，小行星没有。`.se1` 是纯数据文件，JS 侧没有
任何 `require`/`import` 指向它，因此 `@vercel/nft` 不会把它追踪进 serverless bundle ——
必须由 `vercel.json` 的 `includeFiles` 显式带上，路径必须确定。

放 `node_modules/swisseph/ephe/` 里不可靠：npm 安装布局会变，而且这个文件缺失时的失败模式是
**静默的**（`swe_calc_ut` 返回 error，上游只能选择降级或报错）。2026-08 之前线上就因为这个
文件不在位，五颗小行星连续几个月返回编造的假位置。文件锁在仓库里，路径就不会漂。

## 文件清单

- `seas_18.se1`｜地位：小行星星历｜功能：Chiron / Ceres / Pallas / Juno / Vesta 的位置数据，
  覆盖 1800–2399 年。223 KB。SHA-256 `0afe3f94769b6718082411c2c4fb06bf9d1aaa6c0bc1bad8f8b8725421ef8748`。
  来源：`node_modules/swisseph@0.5.17/ephe/seas_18.se1`（Astrodienst 原始分发）。

## 未收录的文件与原因

`sepl_18.se1`（行星）与 `semo_18.se1`（月亮）**故意不收录**：主行星与月亮走 swisseph 内置的
Moshier 理论即可，精度差异在角秒量级，对占星解读无影响，不值得为此多背 1.7 MB。

## 覆盖范围之外

`seas_18.se1` 只覆盖 1800–2399 年。范围外（如 1750 年的历史星盘）小行星会算不出来，此时
`ephemeris.ts` 会**省略该天体**并记进 `mockedPlanets`，绝不填充假值。需要扩展年代范围时，
从 Astrodienst 取对应的 `seas_12.se1` 等文件放进本目录并更新 `includeFiles`。

## 变更日志

- 2026-08-14：新建。修复小行星位置返回编造值的生产 bug（KOC 反馈 Chiron/Juno/Ceres/Pallas 错误）。
