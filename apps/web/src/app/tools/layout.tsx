import type { Metadata } from "next";
import { TOOL_REGISTRY } from "@pagelabs/shared";

interface Props {
  children: React.ReactNode;
}

export default function ToolsLayout({ children }: Props) {
  return <>{children}</>;
}

