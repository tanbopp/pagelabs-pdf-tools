import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      // Search Generative AI & AI Search Crawlers: Explicitly allow for GEO (Generative Engine Optimization)
      {
        userAgent: [
          "Google-Extended", // Google Gemini / SGE training & search crawler
          "GPTBot",          // OpenAI ChatGPT search & browsing
          "OAI-SearchBot",   // SearchGPT realtime search
          "ChatGPT-User",    // ChatGPT live user browsing
          "ClaudeBot",       // Anthropic Claude search
          "PerplexityBot",   // Perplexity AI search engine
          "Applebot-Extended", // Apple Intelligence web crawler
          "Bytespider",      // ByteDance / Doubao AI
          "cohere-ai",       // Cohere AI
          "CCBot",           // Common Crawl open dataset
        ],
        allow: "/",
      },
    ],
    sitemap: "https://pagelabs.tanbopp.cloud/sitemap.xml",
    host: "https://pagelabs.tanbopp.cloud",
  };
}
