"use client";

import React, { useState } from "react";
import { MessageSquarePlus, ThumbsUp, ThumbsDown, X, Send } from "lucide-react";
import { toast } from "sonner";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select Thumbs Up or Thumbs Down");
      return;
    }

    setIsSubmitted(true);
    toast.success("Thank you for your feedback! We appreciate your input.");
    setTimeout(() => {
      setIsOpen(false);
      setIsSubmitted(false);
      setRating(null);
      setComment("");
    }, 1500);
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
                onClick={() => setIsOpen(false)}
                aria-label="Close feedback modal"
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <span className="text-2xl">🎉</span>
                <p className="text-sm font-bold text-foreground">Feedback Received!</p>
                <p className="text-xs text-muted-foreground">Thank you for helping us make PageLabs better.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Did you find this tool useful?
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRating("up")}
                      className={`h-11 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        rating === "up"
                          ? "bg-foreground text-background border-foreground"
                          : "bg-secondary/60 border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Yes, useful</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRating("down")}
                      className={`h-11 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        rating === "down"
                          ? "bg-foreground text-background border-foreground"
                          : "bg-secondary/60 border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Could be better</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="feedback-comment" className="text-xs font-semibold text-foreground">
                    Any suggestions? (optional)
                  </label>
                  <textarea
                    id="feedback-comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what we can improve or new tools you need..."
                    className="w-full p-3 rounded-2xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer mt-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Feedback</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

