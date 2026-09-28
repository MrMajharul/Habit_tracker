import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/privacy", "/terms"],
        disallow: [
          "/dashboard",
          "/prayer",
          "/tasks",
          "/habits",
          "/study",
          "/subjects",
          "/focus",
          "/quran",
          "/quran/*",
          "/hadith",
          "/dhikr",
          "/duas",
          "/goals",
          "/analytics",
          "/analytics/*",
          "/ramadan",
          "/settings",
          "/onboarding",
          "/auth",
          "/auth/*",
          "/api",
          "/api/*",
        ],
      },
    ],
  };
}
