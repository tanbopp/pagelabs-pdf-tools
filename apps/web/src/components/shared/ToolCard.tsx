import React from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolCardProps {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  available: boolean;
}

export function ToolCard({
  slug,
  name,
  description,
  icon: Icon,
  available,
}: ToolCardProps) {
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
        <Icon className="h-6 w-6 text-foreground" />
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
