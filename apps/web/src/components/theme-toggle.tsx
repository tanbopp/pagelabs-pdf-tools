"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { HugeSun, HugeMoon } from "@/components/icons";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full border border-border" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors cursor-pointer"
    >
      {theme === "dark" ? (
        <HugeSun size={17} />
      ) : (
        <HugeMoon size={17} />
      )}
    </button>
  );
}
