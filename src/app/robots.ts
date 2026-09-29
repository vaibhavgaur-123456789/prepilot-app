import { BRAND } from "@/config/brand";
import type { MetadataRoute } from "next";

const SITE_URL = BRAND.siteUrl;

// Only public pages are indexable; everything behind login stays private.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/welcome", "/signup", "/login"],
        disallow: ["/api/", "/admin", "/onboarding", "/plan", "/study", "/tests", "/analytics", "/profile", "/coach", "/review", "/notifications", "/attendance", "/alarms", "/syllabus", "/help"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
