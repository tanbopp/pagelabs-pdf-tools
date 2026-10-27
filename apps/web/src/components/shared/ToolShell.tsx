import React from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout-shell";
import { ChevronRight } from "lucide-react";

export interface ToolShellProps {
  title: string;
  description: string;
  slug: string;
  children: React.ReactNode;
}

export function ToolShell({
  title,
  description,
  slug: _slug,
  children,
}: ToolShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">
            Tools
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{title}</span>
        </nav>

        {/* Title & Description */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            {title}
          </h1>
          <p className="text-base font-medium text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Dynamic Tool Content */}
        <div className="flex flex-col gap-8">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
