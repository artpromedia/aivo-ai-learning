import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/careers", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/press-kit", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/coppa-compliance", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/ferpa-compliance", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/accessibility", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return pages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
