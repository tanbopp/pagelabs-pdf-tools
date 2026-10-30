"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { faqLocales, FaqLocaleContent } from "@/locales/faq";

export function FaqClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Determine initial language from query parameter (?lang=id or en), defaulting to 'en'
  const langParam = searchParams.get("lang");
  const initialLang: "en" | "id" = langParam === "id" ? "id" : "en";
  const [lang, setLang] = useState<"en" | "id">(initialLang);
  const [activeQuestionId, setActiveQuestionId] = useState<string>("");

  // Sync state when URL parameter changes
  useEffect(() => {
    if (langParam === "id" || langParam === "en") {
      setLang(langParam);
    }
  }, [langParam]);

  const handleLanguageChange = (newLang: "en" | "id") => {
    setLang(newLang);
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", newLang);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const currentContent: FaqLocaleContent = faqLocales[lang];

  // Flatten all items for JSON-LD schema & intersection observer
  const allItems = currentContent.categories.flatMap((cat) => cat.items);

  // Setup IntersectionObserver to highlight currently viewed question in Right Sidebar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Highlight the first visible question from top
          setActiveQuestionId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-100px 0px -60% 0px",
        threshold: 0.1,
      }
    );

    allItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [lang, allItems]);

  // Generate structured FAQPage Schema covering all tools & questions
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang === "id" ? "id-ID" : "en-US",
    mainEntity: allItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="w-full">
        {/* Top Header Row with Language Switcher */}
        <div className="flex items-center justify-between pb-8 mb-10 border-b border-border">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-2">
              {currentContent.title}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-3xl">
              {currentContent.description}
            </p>
          </div>

          <div
            role="group"
            aria-label="Language Selector"
            className="shrink-0 inline-flex items-center p-1 rounded-full border border-border bg-card/60 backdrop-blur-xs text-xs font-semibold"
          >
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              className={`px-3 py-1 rounded-full transition-colors ${
                lang === "en"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("id")}
              className={`px-3 py-1 rounded-full transition-colors ${
                lang === "id"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={lang === "id"}
            >
              ID
            </button>
          </div>
        </div>

        {/* 3-Column Layout: Left (Categories) | Middle (Content) | Right (On This Page) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
          {/* Column 1: Left Sidebar - Tool Categories */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              {currentContent.categoriesLabel}
            </h3>
            <nav className="flex flex-col space-y-1.5">
              {currentContent.categories.map((category) => (
                <a
                  key={category.id}
                  href={`#category-${category.id}`}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  {category.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Column 2: Center Content - Comprehensive Open-Document Help Center */}
          <main className="lg:col-span-6 flex flex-col space-y-16">
            {currentContent.categories.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-24"
              >
                {/* Category Header (H2) */}
                <div className="border-b border-border pb-3 mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {category.title}
                  </h2>
                </div>

                {/* Question List within Category (H3) */}
                <div className="space-y-10">
                  {category.items.map((item) => (
                    <article
                      key={item.id}
                      id={item.id}
                      className="scroll-mt-24 space-y-3"
                    >
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
                        {item.question}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                        {item.answer}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </main>

          {/* Column 3: Right Sidebar - On This Page (Active Highlights) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pl-3 border-l border-border/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              {currentContent.onThisPageLabel}
            </h3>
            <nav className="flex flex-col space-y-2 text-xs sm:text-sm">
              {allItems.map((item) => {
                const isActive = activeQuestionId === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block leading-snug line-clamp-2 transition-colors ${
                      isActive
                        ? "text-foreground font-bold pl-2 border-l-2 border-foreground -ml-[1px]"
                        : "text-muted-foreground hover:text-foreground font-medium"
                    }`}
                  >
                    {item.question}
                  </a>
                );
              })}
            </nav>
          </aside>
        </div>
      </div>
    </>
  );
}
