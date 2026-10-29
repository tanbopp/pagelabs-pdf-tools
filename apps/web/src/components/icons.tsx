"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GitMergeIcon,
  SplitIcon,
  Layers01Icon,
  RotateClockwiseIcon,
  FileSecurityIcon,
  Wrench01Icon,
  Zip01Icon,
  Pdf01Icon,
  Doc01Icon,
  Table01Icon,
  Presentation01Icon,
  Image01Icon,
  GlobeIcon,
  LockIcon,
  LockOpenIcon,
  PenTool01Icon,
  EyeOffIcon,
  EyeIcon,
  AiSparklesIcon,
  AiTranslateIcon,
  AiScanIcon,
  Search01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  Upload01Icon,
  RefreshIcon,
  Alert02Icon,
  Download01Icon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  MessageSquareIcon,
  SentIcon,
  FileMinusIcon,
  FileSpreadsheetIcon,
  Delete02Icon,
  Sun01Icon,
  Moon02Icon,
  CheckIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

// Map tool identifiers to corresponding Hugeicons
export const HUGE_ICON_MAP: Record<string, typeof Pdf01Icon> = {
  Combine: GitMergeIcon,
  Split: SplitIcon,
  FileMinus: FileMinusIcon || Doc01Icon,
  FileSpreadsheet: FileSpreadsheetIcon || Table01Icon,
  Layers: Layers01Icon,
  RotateCw: RotateClockwiseIcon,
  Minimize2: Zip01Icon,
  Wrench: Wrench01Icon,
  FileSearch: Search01Icon,
  Archive: Zip01Icon,
  FileText: Doc01Icon,
  Table: Table01Icon,
  Presentation: Presentation01Icon,
  Image: Image01Icon,
  Globe: GlobeIcon,
  Lock: LockIcon,
  Unlock: LockOpenIcon,
  PenTool: PenTool01Icon,
  EyeOff: EyeOffIcon,
  Eye: EyeIcon,
  Sparkles: AiSparklesIcon,
  Languages: AiTranslateIcon,
  Scan: AiScanIcon,
};

export interface AppIconProps {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Universal Hugeicons Renderer for PageLabs
 */
export function AppIcon({
  name,
  className,
  size = 24,
  strokeWidth = 1.8,
}: AppIconProps) {
  const iconData = HUGE_ICON_MAP[name] || Pdf01Icon;
  return (
    <HugeiconsIcon
      icon={iconData}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}

// Named exports for explicit component usage
export function HugeArrowRight({ className, size = 16 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={ArrowRight01Icon} size={size} strokeWidth={2} className={className} />;
}

export function HugeArrowLeft({ className, size = 16 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={ArrowLeft01Icon} size={size} strokeWidth={2} className={className} />;
}

export function HugeClose({ className, size = 16 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={Cancel01Icon} size={size} strokeWidth={2} className={className} />;
}

export function HugeUpload({ className, size = 32 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={Upload01Icon} size={size} strokeWidth={1.8} className={className} />;
}

export function HugeRefresh({ className, size = 16 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={RefreshIcon} size={size} strokeWidth={1.8} className={className} />;
}

export function HugeAlert({ className, size = 20 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={Alert02Icon} size={size} strokeWidth={1.8} className={className} />;
}

export function HugeDownload({ className, size = 16 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={Download01Icon} size={size} strokeWidth={2} className={className} />;
}

export function HugePdfFile({ className, size = 24 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={Pdf01Icon} size={size} strokeWidth={1.8} className={className} />;
}

export function HugeDelete({ className, size = 16 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={Delete02Icon} size={size} strokeWidth={1.8} className={className} />;
}

export function HugeSun({ className, size = 18 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={Sun01Icon} size={size} strokeWidth={1.8} className={className} />;
}

export function HugeMoon({ className, size = 18 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={Moon02Icon} size={size} strokeWidth={1.8} className={className} />;
}

export function HugeCheck({ className, size = 16 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={CheckIcon} size={size} strokeWidth={2.2} className={className} />;
}

export function HugeCheckCircle({ className, size = 20 }: { className?: string; size?: number }) {
  return <HugeiconsIcon icon={CheckmarkCircle02Icon} size={size} strokeWidth={2} className={className} />;
}
