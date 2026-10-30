import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout-shell";
import { FaqClient } from "./FaqClient";

export const metadata: Metadata = {
  title: "Help Center & FAQ — PageLabs",
  description:
    "Comprehensive Help Center and tool-specific FAQ covering all 25 PageLabs PDF utilities, file security, 2-hour shredding policy, limits, and processing features.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Help Center & FAQ — PageLabs",
    description:
      "Comprehensive Help Center and tool-specific FAQ covering all 25 PageLabs PDF utilities, file security, 2-hour shredding policy, limits, and processing features.",
    url: "/faq",
    type: "website",
  },
};

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground scroll-smooth">
      <Header />
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-10 sm:py-16">
        <Suspense
          fallback={
            <div className="w-full py-16 text-center text-muted-foreground animate-pulse font-medium">
              Loading Help Center...
            </div>
          }
        >
          <FaqClient />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
