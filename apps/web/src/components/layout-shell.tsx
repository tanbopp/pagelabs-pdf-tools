import React from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="w-full sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="w-full px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-2xl font-extrabold tracking-tight text-foreground">
            PageLabs
          </span>
        </Link>

        {/* Center: Horizontal Navigation Menu (iLovePDF Style) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-semibold text-muted-foreground">
          <Link
            href="/tools/merge-pdf"
            className="px-3.5 py-1.5 rounded-full hover:text-foreground hover:bg-secondary/70 transition-colors uppercase tracking-wider text-xs font-bold"
          >
            Merge PDF
          </Link>
          <Link
            href="/tools/split-pdf"
            className="px-3.5 py-1.5 rounded-full hover:text-foreground hover:bg-secondary/70 transition-colors uppercase tracking-wider text-xs font-bold"
          >
            Split PDF
          </Link>
          <Link
            href="/tools/compress-pdf"
            className="px-3.5 py-1.5 rounded-full hover:text-foreground hover:bg-secondary/70 transition-colors uppercase tracking-wider text-xs font-bold"
          >
            Compress PDF
          </Link>
          <Link
            href="/tools/pdf-to-word"
            className="px-3.5 py-1.5 rounded-full hover:text-foreground hover:bg-secondary/70 transition-colors uppercase tracking-wider text-xs font-bold"
          >
            Convert PDF
          </Link>
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full hover:text-foreground hover:bg-secondary/70 transition-colors uppercase tracking-wider text-xs font-bold text-foreground"
          >
            All PDF Tools
          </Link>
        </nav>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/"
            className="hidden sm:inline-flex h-9 px-4 rounded-full border border-border bg-card hover:bg-secondary text-xs font-bold text-foreground items-center justify-center transition-colors"
          >
            Explore
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-border py-8 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>PageLabs — Pure utility. Zero noise.</span>
          <span className="hidden sm:inline">·</span>
          <span>No cookies · Files shredded in 2h</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
