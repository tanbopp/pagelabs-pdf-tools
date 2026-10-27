"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface CustomSelectProps<T extends string = string> {
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CustomSelect<T extends string = string>({
  id,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select an option",
  className = "",
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${className}`}
    >
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-11 px-4 rounded-2xl border border-border bg-background text-xs font-semibold text-foreground flex items-center justify-between gap-2 hover:bg-secondary/40 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${isOpen ? "ring-1 ring-ring border-foreground/30" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 py-1.5 rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-md max-h-60 overflow-y-auto focus:outline-none animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-4 py-2.5 text-xs font-semibold flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-secondary text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="truncate">{opt.label}</span>
                  {opt.description && (
                    <span className="text-[11px] font-normal text-muted-foreground truncate">
                      {opt.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
