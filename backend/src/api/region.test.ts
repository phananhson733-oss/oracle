// INPUT: regionRouter；vitest + supertest 构造最小 express app。
// OUTPUT: 断言 GET /api/region 正确回显国家码（大写归一化）、缺头/非法头 → null、no-store。
// POS: Region API 测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { regionRouter } from "./region.js";

const app = express();
app.use("/api/region", regionRouter);

describe("/api/region", () => {
  it("回显 x-vercel-ip-country（大写）+ no-store", async () => {
    const res = await request(app)
      .get("/api/region")
      .set("x-vercel-ip-country", "de");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ country: "DE" });
    expect(res.headers["cache-control"]).toContain("no-store");
  });

  it("缺国家头 → { country: null }", async () => {
    const res = await request(app).get("/api/region");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ country: null });
  });

  it("非法国家头（长度≠2）→ { country: null }", async () => {
    const res = await request(app)
      .get("/api/region")
      .set("x-vercel-ip-country", "XX1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ country: null });
  });
});
