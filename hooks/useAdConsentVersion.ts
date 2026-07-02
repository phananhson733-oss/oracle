// INPUT: services/adConsentBus 的 subscribeAdConsent。
// OUTPUT: useAdConsentVersion() — 返回一个随广告同意变化自增的版本号，供 AdSlot 订阅后重算门控。
// POS: 广告同意响应式 hook；若更新此文件，务必更新 hooks/FOLDER.md。

import { useEffect, useState } from "react";
import { subscribeAdConsent } from "../services/adConsentBus";

export const useAdConsentVersion = (): number => {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeAdConsent(() => setVersion((v) => v + 1)), []);
  return version;
};
