import { HUGE_ICON_MAP } from "@/components/icons";

export function getToolIconName(identifier: string): string {
  if (HUGE_ICON_MAP[identifier]) {
    return identifier;
  }
  return "FileText";
}
