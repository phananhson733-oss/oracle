// INPUT: 根 types.ts 的 T.SynastryTab 与各 synastry 内容类型。
// OUTPUT: SynastryTabId（tab 标识别名）+ SynastryTabContentMap（每个 tab 对应的内容形状映射），供 SynastryPage 编排与子视图共用。
// POS: synastry 页面内部类型契约。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type * as T from "../../types";

export type SynastryTabId = T.SynastryTab;

export type SynastryTabContentMap = {
  overview: T.SynastryOverviewContent;
  natal_a: T.NatalScript;
  natal_b: T.NatalScript;
  syn_ab: T.PerspectiveData;
  syn_ba: T.PerspectiveData;
  composite: T.CompositeContent;
};
