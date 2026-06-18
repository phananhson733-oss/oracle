<!-- INPUT: data/sources（SIGNS）。纯算法，无星历/IO 依赖。 -->
<!-- OUTPUT: 天象工具纯函数（月相 / 黄经→星座 / 日期范围枚举），供 api/astro.ts 的 sky 工具端点调用。 -->
<!-- POS: backend/src/services/astro 子目录索引；若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：backend/src/services/astro

架构概要
- 天象（sky）工具的纯算法层：把星历取数（`ephemeris.ts` 的 `getLongitudes`）的结果，转成产品可读的月相/星座/星历表。
- 与 `api/astro.ts` 的关系：端点负责取数 + 缓存 + 完整性闸门；本目录只做无 IO 的确定性数学，便于 100% 单测。

文件清单
- FOLDER.md｜地位：目录索引文档。
- skyTools.ts｜地位：天象纯算法｜功能：`longitudeToSign`（黄经→星座+座内度数，自动归一）、`moonPhase`（日月黄经→夹角/8 相名/受照比例/盈亏）、`enumerateDates`（含端点日期范围枚举 + 步长 + 上限裁剪）。
- skyTools.test.ts｜地位：上述纯函数的单元测试（22 例，覆盖边界 + 归一 + 八相分类 + 裁剪/越界）。
- solarReturn.ts｜地位：返照时刻求解器（纯，注入 sunLongitudeAt 便于单测）｜功能：`solveReturnInstant` —— 生日窗口内对带符号夹角二分到分钟精度求太阳回到本命经度的时刻，窗口不够自扩。供 `api/solar-return.ts` 调用。
- solarReturn.test.ts｜地位：求解器单测（5 例，覆盖命中已知过境/漂移/窗口自扩/0-360 翻转/经度匹配）。

近期更新
- 2026-06-18 新建：D 计算器矩阵第二批「天象工具集」的纯算法层。配套端点 `/api/astro/positions`、`/api/astro/moon-phase`、`/api/astro/ephemeris`。
- 2026-06-18 新增 solarReturn.ts（返照时刻求解器），配套端点 `POST /api/solar-return`（计算器 solar-return-calculator）。
