"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
}

export const OCR_LANGUAGES: LanguageOption[] = [
  { code: "eng", name: "English" },
  { code: "ind", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "spa", name: "Spanish", nativeName: "Español" },
  { code: "fra", name: "French", nativeName: "Français" },
  { code: "deu", name: "German", nativeName: "Deutsch" },
  { code: "ita", name: "Italian", nativeName: "Italiano" },
  { code: "por", name: "Portuguese", nativeName: "Português" },
  { code: "nld", name: "Dutch; Flemish", nativeName: "Nederlands" },
  { code: "rus", name: "Russian", nativeName: "Русский" },
  { code: "ara", name: "Arabic", nativeName: "العربية" },
  { code: "hin", name: "Hindi", nativeName: "हिन्दी" },
  { code: "jpn", name: "Japanese", nativeName: "日本語" },
  { code: "kor", name: "Korean", nativeName: "한국어" },
  { code: "chi_sim", name: "Chinese - Simplified", nativeName: "简体中文" },
  { code: "chi_tra", name: "Chinese - Traditional", nativeName: "繁體中文" },
  { code: "tur", name: "Turkish", nativeName: "Türkçe" },
  { code: "pol", name: "Polish", nativeName: "Polski" },
  { code: "vie", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "tha", name: "Thai", nativeName: "ไทย" },
  { code: "swe", name: "Swedish", nativeName: "Svenska" },
  { code: "dan", name: "Danish", nativeName: "Dansk" },
  { code: "fin", name: "Finnish", nativeName: "Suomi" },
  { code: "nor", name: "Norwegian", nativeName: "Norsk" },
  { code: "ces", name: "Czech", nativeName: "Čeština" },
  { code: "ell", name: "Greek", nativeName: "Ελληνικά" },
  { code: "heb", name: "Hebrew", nativeName: "עברית" },
  { code: "hun", name: "Hungarian", nativeName: "Magyar" },
  { code: "ron", name: "Romanian", nativeName: "Română" },
  { code: "ukr", name: "Ukrainian", nativeName: "Українська" },
  { code: "fil", name: "Filipino", nativeName: "Tagalog" },
  { code: "msa", name: "Malay", nativeName: "Bahasa Melayu" },
];

interface OcrLanguageSelectorProps {
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
}

export function OcrLanguageSelector({
  selectedCodes,
  onChange,
  maxSelections = 3,
  disabled = false,
}: OcrLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return OCR_LANGUAGES;
    const q = searchQuery.toLowerCase().trim();
    return OCR_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        (lang.nativeName && lang.nativeName.toLowerCase().includes(q)) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleToggle = (code: string) => {
    if (selectedCodes.includes(code)) {
      // Don't remove if it's the last selected language
      if (selectedCodes.length <= 1) return;
      onChange(selectedCodes.filter((c) => c !== code));
    } else {
      if (selectedCodes.length >= maxSelections) return;
      onChange([...selectedCodes, code]);
    }
  };

  const handleRemove = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (selectedCodes.length <= 1) return;
    onChange(selectedCodes.filter((c) => c !== code));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Box with Selected Language Badges */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          "w-full min-h-[44px] p-1.5 px-3 rounded-2xl border border-border bg-background flex items-center justify-between gap-2 cursor-pointer transition-colors select-none",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-1 ring-ring border-foreground/30",
          !disabled && "hover:bg-secondary/40"
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedCodes.map((code) => {
            const lang = OCR_LANGUAGES.find((l) => l.code === code);
            const label = lang ? lang.name : code;
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary text-foreground text-xs font-semibold leading-none shadow-none border border-border/60 animate-in fade-in zoom-in-95 duration-100"
              >
                <span>{label}</span>
                {selectedCodes.length > 1 && !disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, code)}
                    className="h-3.5 w-3.5 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={`Remove ${label}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-foreground"
          )}
        />
      </div>

      {/* Dropdown Menu (Search + Multi-select List) */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-72">
          {/* Search Input Bar */}
          <div className="p-2 border-b border-border bg-muted/20">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Languages Scrollable List */}
          <div className="overflow-y-auto p-1.5 flex flex-col gap-0.5 max-h-56">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No languages found
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = selectedCodes.includes(lang.code);
                const isMaxReached =
                  !isSelected && selectedCodes.length >= maxSelections;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => !isMaxReached && handleToggle(lang.code)}
                    disabled={isMaxReached}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-colors cursor-pointer",
                      isSelected
                        ? "bg-secondary text-foreground font-semibold"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                      isMaxReached && "opacity-40 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    {/* Checkbox box */}
                    <div
                      className={cn(
                        "h-4 w-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/50 bg-background"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="truncate">{lang.name}</span>
                      {lang.nativeName && (
                        <span className="text-[11px] text-muted-foreground font-normal truncate">
                          ({lang.nativeName})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

