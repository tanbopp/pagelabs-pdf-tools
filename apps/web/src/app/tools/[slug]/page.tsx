import Link from "next/link";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { Header } from "@/components/layout-shell";
import { TOOL_REGISTRY } from "@pagelabs/shared";
import { ChevronRight, ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return Object.keys(TOOL_REGISTRY).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOL_REGISTRY[slug];
  if (!tool) return { title: "PageLabs" };

  const title = `${tool.name} - Free Online PDF Tool | PageLabs`;
  const description = `${tool.description} Fast, secure, and 100% free online PDF processing.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "PageLabs",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

interface PlaceholderProps {
  params: Promise<{ slug: string }>;
}

export default async function PlaceholderPage({ params }: PlaceholderProps) {
  const { slug } = await params;
  const tool = TOOL_REGISTRY[slug];

  if (!tool) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 flex flex-col justify-start">
        {/* Title & Coming Soon body */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {tool.name}
          </h1>
        </div>

        {/* Back to tools button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-border bg-card text-foreground font-semibold hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to tools</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
