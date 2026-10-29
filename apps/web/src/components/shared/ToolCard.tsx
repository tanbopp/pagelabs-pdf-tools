import React from "react";
import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface ToolCardProps {
  slug: string;
  name: string;
  description: string;
  iconName: string;
  available: boolean;
  category?: string;
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  // 1. Organize & Manage (Biru)
  organize: "text-blue-500 dark:text-blue-400",
  // 2. Optimize & Repair (Hijau)
  optimize: "text-emerald-500 dark:text-emerald-400",
  // 3. Convert To PDF (Kuning/Oranye)
  "convert-to": "text-amber-500 dark:text-amber-400",
  // 4. Convert From PDF (Ungu)
  "convert-from": "text-violet-500 dark:text-violet-400",
  // 5. Edit PDF (Pink/Rose)
  edit: "text-rose-500 dark:text-rose-400",
  // 6. PDF Security (Merah Gelap / Crimson)
  security: "text-red-500 dark:text-red-400",
  // 7. PDF Intelligence / AI (Cyan/Teal)
  ai: "text-cyan-500 dark:text-cyan-400",
};

export function ToolCard({
  slug,
  name,
  description,
  iconName,
  available,
  category,
}: ToolCardProps) {
  const iconColorClass =
    (category && CATEGORY_COLOR_MAP[category]) || "text-foreground";

  const content = (
    <div
      className={cn(
        "relative rounded-3xl border border-border bg-card p-6 flex flex-col justify-between min-h-[140px] transition-colors",
        available
          ? "hover:border-foreground/40 cursor-pointer"
          : "opacity-50 cursor-not-allowed select-none"
      )}
    >
      <div className="flex items-start justify-between">
        <AppIcon
          name={iconName}
          size={26}
          strokeWidth={1.8}
          className={cn("transition-colors duration-200", iconColorClass)}
        />
        {!available && (
          <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            Coming soon
          </span>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-base font-semibold text-foreground truncate">
          {name}
        </h3>
        <p className="text-sm font-medium text-muted-foreground truncate mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );

  if (!available) {
    return content;
  }

  return (
    <Link href={`/tools/${slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl">
      {content}
    </Link>
  );
}
