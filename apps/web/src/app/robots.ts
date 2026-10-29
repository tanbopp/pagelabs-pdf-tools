import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://tanbopp.cloud/sitemap.xml",
    host: "https://tanbopp.cloud",
  };
}

