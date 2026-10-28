import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout-shell";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6 border border-border">
          <FileQuestion className="w-8 h-8 text-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">404 — Page Not Found</h1>
        <p className="text-muted-foreground text-sm max-w-md mb-8">
          The page or PDF tool you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tools</span>
        </Link>
      </main>
    </div>
  );
}

