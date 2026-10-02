"use client";

import {
  BookOpen,
  Bug,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  History,
  Info,
  Lightbulb,
  Mail,
  MessageSquare,
  MessageSquarePlus,
  Send,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORY_METADATA,
  FeedbackCategory,
  FeedbackSubmission,
  buildSupportMailtoLink,
  clearStoredFeedbacks,
  formatDiagnosticsSummary,
  formatFeedbackForClipboard,
  getStoredFeedbacks,
  getSystemDiagnostics,
  saveFeedback,
} from "@/services/feedback/feedback-service";

interface FeedbackDialogProps {
  userEmail?: string;
  userName?: string;
}

export function FeedbackDialog({ userEmail = "", userName = "" }: FeedbackDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<FeedbackCategory>("general");
  const [rating, setRating] = React.useState<number>(5);
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [email, setEmail] = React.useState(userEmail);
  const [includeDiagnostics, setIncludeDiagnostics] = React.useState(true);
  const [showDiagnosticsPreview, setShowDiagnosticsPreview] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Past submissions
  const [submissions, setSubmissions] = React.useState<FeedbackSubmission[]>([]);

  React.useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      setSubmissions(getStoredFeedbacks());
      if (userEmail && !email) {
        setEmail(userEmail);
      }
    });
  }, [open, userEmail, email]);

  const diagnostics = React.useMemo(() => {
    return getSystemDiagnostics();
  }, []);

  const handleCategorySelect = (cat: FeedbackCategory) => {
    setCategory(cat);
  };

  const handleCopyClipboard = async () => {
    try {
      const formatted = formatFeedbackForClipboard({
        category,
        rating,
        subject,
        message,
        email,
        diagnostics: includeDiagnostics ? diagnostics : undefined,
      });
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      toast.success("Feedback & diagnostics copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const handleOpenEmail = () => {
    if (!message.trim()) {
      toast.error("Please enter a short message before sending.");
      return;
    }

    const mailto = buildSupportMailtoLink({
      category,
      subject: subject || CATEGORY_METADATA[category].label,
      message,
      userEmail: email,
      diagnostics: includeDiagnostics ? diagnostics : undefined,
    });

    window.open(mailto, "_blank");
    toast.success("Opening your email client...");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter your message or description.");
      return;
    }

    setIsSubmitting(true);

    try {
      const saved = saveFeedback({
        category,
        subject: subject.trim() || CATEGORY_METADATA[category].label,
        message: message.trim(),
        email: email.trim() || undefined,
        rating,
        diagnostics: includeDiagnostics ? diagnostics : undefined,
      });

      setSubmissions((prev) => [saved, ...prev]);
      toast.success("Jazakallahu Khair! Your feedback has been recorded.", {
        description:
          "Thank you for helping us improve Istiqamaah for the entire Ummah.",
      });

      // Reset form
      setSubject("");
      setMessage("");
      setRating(5);

      setTimeout(() => {
        setIsSubmitting(false);
        setOpen(false);
      }, 700);
    } catch {
      setIsSubmitting(false);
      toast.error("Could not save feedback. Please try again or use direct email.");
    }
  };

  const handleClearHistory = () => {
    clearStoredFeedbacks();
    setSubmissions([]);
    toast.info("Feedback submission history cleared.");
  };

  const getCategoryIcon = (cat: FeedbackCategory) => {
    switch (cat) {
      case "bug":
        return <Bug className="size-4" />;
      case "feature":
        return <Lightbulb className="size-4" />;
      case "correction":
        return <BookOpen className="size-4" />;
      case "question":
        return <Info className="size-4" />;
      case "general":
      default:
        return <MessageSquare className="size-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <MessageSquarePlus className="size-4" />
          <span>Send Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogPopup>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold">
                    Feedback &amp; Support
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Share bug reports, feature requests, or suggestions to improve Istiqamaah.
                  </DialogDescription>
                </div>
              </div>

              {submissions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="h-8 gap-1.5 text-xs text-muted-foreground"
                >
                  <History className="size-3.5" />
                  <span>{showHistory ? "New Feedback" : `History (${submissions.length})`}</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {showHistory ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Recent Feedback Logs
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
                >
                  <Trash2 className="size-3" />
                  Clear Logs
                </Button>
              </div>

              {submissions.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No previous feedback submissions found on this device.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
                  {submissions.map((sub) => {
                    const meta = CATEGORY_METADATA[sub.category];
                    return (
                      <div
                        key={sub.id}
                        className="rounded-lg border border-border bg-card p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {getCategoryIcon(sub.category)}
                            <span className="text-xs font-semibold">{meta.label}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(sub.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground">{sub.subject}</p>
                        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                          {sub.message}
                        </p>
                        {sub.rating && (
                          <div className="flex items-center gap-1 pt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`size-3 ${
                                  i < (sub.rating ?? 0)
                                    ? "text-amber-400"
                                    : "text-muted-foreground/30"
                                }`}
                                fill={i < (sub.rating ?? 0) ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full text-xs"
                onClick={() => setShowHistory(false)}
              >
                Back to Feedback Form
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 space-y-4">
              {/* Category picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Feedback Category
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(
                    Object.keys(CATEGORY_METADATA) as FeedbackCategory[]
                  ).map((catKey) => {
                    const isSelected = category === catKey;
                    const meta = CATEGORY_METADATA[catKey];
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => handleCategorySelect(catKey)}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <span className="shrink-0">{getCategoryIcon(catKey)}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{meta.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {meta.labelBn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground">How is your experience?</p>
                  <p className="text-[10px] text-muted-foreground">
                    {rating === 5 && "Alhamdulillah! Excellent"}
                    {rating === 4 && "Very Good"}
                    {rating === 3 && "Neutral / Okay"}
                    {rating === 2 && "Needs Improvement"}
                    {rating === 1 && "Disappointed"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      className="p-1 hover:scale-110 transition-transform"
                      aria-label={`${starVal} stars`}
                    >
                      <Star
                        className={`size-4 sm:size-5 ${
                          starVal <= rating
                            ? "text-amber-400"
                            : "text-muted-foreground/30 hover:text-muted-foreground"
                        }`}
                        fill={starVal <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="feedback-subject" className="text-xs font-medium text-foreground">
                  Subject or Topic
                </Label>
                <Input
                  id="feedback-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={`e.g., ${
                    category === "bug"
                      ? "Prayer notification on mobile lockscreen"
                      : category === "correction"
                      ? "Surah Al-Mulk ayah 14 translation typo"
                      : category === "feature"
                      ? "Add widget for daily Dhikr counter"
                      : "General suggestions for Istiqamaah"
                  }`}
                  className="h-9 text-xs"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="feedback-message" className="text-xs font-medium text-foreground">
                  Message / Details <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="feedback-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or suggestion in detail. What happened? What did you expect?"
                  className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* User Email (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="feedback-email" className="text-xs font-medium text-foreground">
                  Contact Email <span className="text-muted-foreground text-[10px]">(optional for follow-up)</span>
                </Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={userEmail || "your.email@example.com"}
                  className="h-9 text-xs"
                />
              </div>

              {/* System Diagnostics Checkbox */}
              <div className="rounded-lg border border-border/80 bg-muted/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={includeDiagnostics}
                      onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                      className="size-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <span>Attach anonymous system diagnostics</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDiagnosticsPreview(!showDiagnosticsPreview)}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <span>{showDiagnosticsPreview ? "Hide" : "Preview"}</span>
                    <ChevronDown
                      className={`size-3 transition-transform ${
                        showDiagnosticsPreview ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground leading-normal">
                  Includes OS, browser, screen resolution, timezone, and app version. No personal data or habit history is shared.
                </p>

                {showDiagnosticsPreview && (
                  <pre className="mt-2 rounded bg-muted/60 p-2.5 font-mono text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {formatDiagnosticsSummary(diagnostics)}
                  </pre>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyClipboard}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    title="Copy formatted feedback & diagnostics to clipboard"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    <span>{copied ? "Copied" : "Copy Info"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEmail}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    title="Open directly in email client"
                  >
                    <Mail className="size-3.5" />
                    <span>Open Email</span>
                  </Button>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !message.trim()}
                  className="h-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Feedback"}</span>
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </DialogPopup>
    </Dialog>
  );
}
