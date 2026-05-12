import type { MetadataRoute } from "next";

// Open robots policy — Compass wants to be findable. The /api/* routes
// are excluded because they return JSON/data, not pages worth indexing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: "https://app-psi-pied.vercel.app/sitemap.xml",
    host: "https://app-psi-pied.vercel.app",
  };
}
