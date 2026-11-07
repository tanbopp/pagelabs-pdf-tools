import type { Metadata } from "next";
import { ToolSeoSection } from "@/components/seo/ToolSeoSection";
import { buildToolJsonLd, buildToolMetadata } from "@/lib/tool-seo";

const SLUG = "edit-pdf";

export function generateMetadata(): Metadata {
  return buildToolMetadata(SLUG);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = buildToolJsonLd(SLUG);

  return (
    <>
      {children}
      <ToolSeoSection slug={SLUG} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
