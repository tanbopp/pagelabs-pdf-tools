import type { Metadata } from "next";
import { TOOL_REGISTRY } from "@pagelabs/shared";

export async function generateMetadata(): Promise<Metadata> {
  const tool = TOOL_REGISTRY["edit-pdf"];
  const title = tool ? `${tool.name} - Free Online PDF Tool` : "Edit PDF";
  const description = tool ? `${tool.description} Fast, secure, and 100% free online PDF processing on tanbopp.cloud.` : "Clean, modern online PDF editing tools.";
  return {
    title,
    description,
    alternates: {
      canonical: "/tools/edit-pdf",
    },
    openGraph: {
      title: `${title} | PageLabs`,
      description,
      url: "https://tanbopp.cloud/tools/edit-pdf",
      type: "website",
      siteName: "PageLabs",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PageLabs`,
      description,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

