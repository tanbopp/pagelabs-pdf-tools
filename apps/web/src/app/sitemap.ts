import { MetadataRoute } from "next";
import { TOOL_REGISTRY } from "@pagelabs/shared";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tanbopp.cloud";
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = Object.keys(TOOL_REGISTRY).map((slug) => ({
    url: `${baseUrl}/tools/${slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...toolPages];
}

