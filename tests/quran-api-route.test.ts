import { describe, it, expect } from "vitest";

import { GET } from "@/app/api/quran/route";

describe("Quran API Route (/api/quran)", () => {
  it("returns 400 when no parameters are provided", async () => {
    const req = new Request("http://localhost:3000/api/quran");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for invalid surah numbers", async () => {
    const req0 = new Request("http://localhost:3000/api/quran?surah=0");
    const res0 = await GET(req0);
    expect(res0.status).toBe(400);

    const req115 = new Request("http://localhost:3000/api/quran?surah=115");
    const res115 = await GET(req115);
    expect(res115.status).toBe(400);

    const reqInvalid = new Request("http://localhost:3000/api/quran?surah=abc");
    const resInvalid = await GET(reqInvalid);
    expect(resInvalid.status).toBe(400);
  });

  it("returns ayahs for valid surah (Surah 1: Al-Fatihah)", async () => {
    const req = new Request("http://localhost:3000/api/quran?surah=1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.ayahs).toHaveLength(7);
    expect(json.ayahs[0].text).toContain("بِسْمِ");
    expect(json.ayahs[0].translation).toBeDefined();
    expect(json.ayahs[0].translationBn).toBeDefined();
  });
});
