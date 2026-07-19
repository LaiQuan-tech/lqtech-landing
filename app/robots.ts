import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/quote", "/contract", "/pay", "/portal"],
    },
    sitemap: "https://laiquan.co/sitemap.xml",
  };
}
