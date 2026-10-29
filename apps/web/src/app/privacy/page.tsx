import React from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout-shell";

export const metadata = {
  title: "Privacy Policy — PageLabs",
  description: "Strict, ephemeral PDF processing. Pure privacy by architectural design.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-20">
        <div className="mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Last updated October 2026. Privacy is our primary technical constraint, not an afterthought.
          </p>
        </div>

        {/* Scan-able, structured sections */}
        <div className="flex flex-col gap-12 text-sm leading-relaxed">
          <section className="flex flex-col gap-2.5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              1. 2-Hour File Shredding
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Every document you upload and every output generated is strictly temporary. An automated background worker irreversibly purges all job artifacts and files from disk within <strong>2 hours</strong> of processing. No archives, no backups, no data retention.
            </p>
          </section>

          <section className="flex flex-col gap-2.5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              2. Zero Tracking & No Profiling
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not use tracking cookies, analytics pixels, or user fingerprinting. We do not sell, rent, or trade your document metadata or personal identity. Preferences such as your visual color theme are saved exclusively in your browser&apos;s local storage.
            </p>
          </section>

          <section className="flex flex-col gap-2.5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              3. Sandboxed Pipeline Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Documents are processed inside isolated container sandboxes. We never inspect the contents of your files, nor do we feed user documents into machine learning models for training.
            </p>
          </section>

          <div className="pt-12 border-t border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              ← Back to Tools
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
