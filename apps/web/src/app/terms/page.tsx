import React from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout-shell";

export const metadata = {
  title: "Terms of Service — PageLabs",
  description: "Terms of Service and conditions for using PageLabs online PDF tools.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-20">
        <div className="mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">
            Terms of Service
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Clear, plain-English legal guidelines governing your use of PageLabs.
          </p>
        </div>

        {/* Scan-able, structured sections */}
        <div className="flex flex-col gap-12 text-sm leading-relaxed">
          <section className="flex flex-col gap-2.5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              1. Service Provided &quot;As-Is&quot;
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              PageLabs provides browser-based and server-side document processing utilities on an &quot;as-is&quot; basis without express or implied warranties. While we strive for 100% precision with modern engines, you are advised to maintain your own original file copies.
            </p>
          </section>

          <section className="flex flex-col gap-2.5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              2. User Responsibility
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain full ownership and intellectual property rights over any file uploaded to PageLabs. You represent and warrant that you hold all legal rights, licenses, or permissions necessary to process the content.
            </p>
          </section>

          <section className="flex flex-col gap-2.5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              3. No Unlawful or Malicious Payloads
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to upload malicious binaries, exploits, or illegal materials. We reserve the right to immediately abort and reject any payload flagged by our file validation and security sandboxes.
            </p>
          </section>

          <div className="pt-12 border-t border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              ← Back to Tools
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
