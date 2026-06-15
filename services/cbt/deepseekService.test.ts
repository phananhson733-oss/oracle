// @vitest-environment jsdom
// INPUT: analyzeCBTRecord 的单元测试（含危机短路识别 + 正常/异常分支）。
// OUTPUT: 验证 crisis 响应不被误判为 AI 失败、正常返回 content、无 content 抛错。
// POS: CBT 前端服务单测；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeCBTRecord } from "./deepseekService";
import type { CBTRecord } from "../../components/cbt/types";
import type { UserProfile } from "../../types";
import * as apiClient from "../apiClient";

vi.mock("../apiClient", () => ({
  fetchCBTAnalysis: vi.fn(),
}));

const mockRecord = {
  id: "1",
  timestamp: 0,
  situation: "s",
  moods: [],
  automaticThoughts: [],
  hotThought: "",
  evidenceFor: [],
  evidenceAgainst: [],
  balancedEntries: [],
} as unknown as CBTRecord;

const mockProfile = {} as UserProfile;
const mockReport = {
  summary: "x",
  distortions: [],
  reframe: "y",
  encouragement: "z",
};

describe("analyzeCBTRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the crisis payload instead of throwing when backend short-circuits", async () => {
    const crisis = {
      status: "crisis_detected",
      helpline: { region: "CN", name_zh: "", name_en: "", phone: "", url: "" },
      message_zh: "a",
      message_en: "b",
    };
    vi.mocked(apiClient.fetchCBTAnalysis).mockResolvedValue(crisis);
    const result = await analyzeCBTRecord(mockRecord, mockProfile);
    expect(result).toEqual(crisis);
  });

  it("returns analysis content on a normal response", async () => {
    vi.mocked(apiClient.fetchCBTAnalysis).mockResolvedValue({
      lang: "zh",
      content: mockReport,
    });
    const result = await analyzeCBTRecord(mockRecord, mockProfile);
    expect(result).toEqual(mockReport);
  });

  it("throws AI unavailable when content is missing and not a crisis", async () => {
    vi.mocked(apiClient.fetchCBTAnalysis).mockResolvedValue({ lang: "zh" });
    await expect(analyzeCBTRecord(mockRecord, mockProfile)).rejects.toThrow(
      "AI unavailable",
    );
  });
});
