// INPUT: services/region.ts 的 fetchRegion/getCachedRegion。
// OUTPUT: useRegion() — 返回当前 RegionInfo，异步解析后触发重渲染；命中缓存则同步返回。
// POS: 地域判定 hook；若更新此文件，务必更新 hooks/FOLDER.md 与 region 服务头注释。

import { useEffect, useState } from "react";
import {
  fetchRegion,
  getCachedRegion,
  UNKNOWN_REGION,
  type RegionInfo,
} from "../services/region";

export const useRegion = (): RegionInfo => {
  const [region, setRegion] = useState<RegionInfo>(
    () => getCachedRegion() ?? UNKNOWN_REGION,
  );

  useEffect(() => {
    if (getCachedRegion()) return; // 已缓存，无需再请求
    let alive = true;
    fetchRegion()
      .then((r) => {
        if (alive) setRegion(r);
      })
      .catch(() => {
        /* fetchRegion 内部已 fail-safe，不会抛；此处兜底 */
      });
    return () => {
      alive = false;
    };
  }, []);

  return region;
};
