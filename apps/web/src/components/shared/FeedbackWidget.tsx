"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

    // Extract current tool slug from URL path (e.g. /tools/merge-pdf -> merge-pdf)
    const currentToolSlug = pathname?.startsWith("/tools/")
      ? pathname.replace("/tools/", "").split("/")[0]
      : pathname === "/"
        ? "home"
        : pathname?.replace("/", "") || "unknown";

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

        if (!message.trim()) {
          toast.error("Please enter your message or feedback.");
          return;
        }

        setLoading(true);

        const formData = {
          name: name.trim() || "Anonymous User",
          message: message.trim(),
          tool_slug: currentToolSlug,
          url: typeof window !== "undefined" ? window.location.href : pathname,
          _subject: `PageLabs Feedback [${currentToolSlug}]`,
          _captcha: "false",
        };

        try {
          const response = await fetch("https://formsubmit.co/ajax/info@tanbopp.my.id", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(formData),
          });

          if (response.ok) {
            toast.success("Thank you for your feedback!");
            setName("");
            setMessage("");
            setIsOpen(false);
          } else {
            toast.error("Failed to send feedback. Please try again.");
          }
        } catch (error) {
          console.error("Feedback submit error:", error);
          toast.error("An error occurred. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      return (
    <>
          {/* Floating Feedback Pill on bottom-left, never overlaps bottom-right action buttons */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Send feedback"
            className="fixed bottom-5 left-5 z-40 h-9 px-3.5 rounded-full border border-border bg-card/90 backdrop-blur-md hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground shadow-none flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-foreground" />
            <span>Feedback</span>
          </button>

          {/* Modal Dialog */}
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-title"
                className="w-full max-w-md rounded-3xl border border-border bg-card p-6 flex flex-col gap-5 text-foreground relative animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquarePlus className="w-4 h-4 text-foreground" />
                    <h3 id="feedback-title" className="text-base font-bold text-foreground">
                      Give Feedback
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setIsOpen(false)}
                    aria-label="Close feedback modal"
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      {/* Optional Name */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="feedback-name" className="text-xs font-semibold text-foreground">
                          Name <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <input
                          id="feedback-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name or email"
                          disabled={loading}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                        />
                      </div>

                        {/* Required Message */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="feedback-message" className="text-xs font-semibold text-foreground">
                            Message <span className="text-destructive">*</span>
                          </label>
                          <textarea
                            id="feedback-message"
                            required
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell us what you like, what we can improve, or tools you need..."
                            disabled={loading}
                            className="w-full p-3.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none disabled:opacity-50"
                          />
                        </div>

                        {/* Active Context Tool Indicator */}
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>Tool context:</span>
                          <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                            {currentToolSlug}
                          </span>
                        </div>

                      {/* Submit CTA */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer mt-1"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Feedback</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
        </div>
      )}
            </>
          );
}
