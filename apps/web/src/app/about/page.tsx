import React from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout-shell";

export const metadata = {
  title: "About — PageLabs",
  description: "Built for speed. Designed for focus.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-20 flex flex-col justify-center">
        <div className="max-w-2xl mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.15] mb-4">
            Built for speed.
            <br />
            Designed for focus.
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            PageLabs is a distraction-free suite of pure PDF utilities engineered to do one job effortlessly.
          </p>
        </div>

        {/* 3 Concise Pillars — Minimal Linear/Vercel Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-8 border-t border-border">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-foreground">No Bloat</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No ads, no popups, no forced sign-ups. Open the tool, get your work done, and leave.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-foreground">Native Speed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Processed by C++ and Python native engines in seconds rather than minutes.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-foreground">Absolute Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Files are automatically and irreversibly shredded from storage after 2 hours.
            </p>
          </div>
        </div>

        <div className="pt-16 mt-16 border-t border-border flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Explore tools
          </Link>
          <Link
            href="/privacy"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
