import React from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="w-full border-b border-border bg-background/95">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight text-foreground">
            PageLabs
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-border py-8 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-muted-foreground">
        <div>PageLabs — Pure utility. Zero noise.</div>
        <div>No cookies · Files purged in 2h</div>
      </div>
    </footer>
  );
}
