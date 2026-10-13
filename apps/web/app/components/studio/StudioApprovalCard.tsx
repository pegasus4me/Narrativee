"use client";

import { useState } from "react";
import type { StudioMessage } from "@/lib/api/studio";

export default function StudioApprovalCard({
  message,
  busy,
  error,
  onDecision,
}: {
  message: StudioMessage;
  busy: boolean;
  error?: string;
  onDecision?: (
    message: StudioMessage,
    action: "approve" | "reject" | "refresh",
    feedback: string,
  ) => void;
}) {
  const [revising, setRevising] = useState(false);
  const [feedback, setFeedback] = useState("");
  if (!message.approval) return null;
  const status = message.approval.status;
  const labels = {
    pending: "Your approval is needed",
    executing: "Creating your approved direction",
    completed: "Direction approved and created",
    rejected: "Direction declined or replaced",
    failed: "Creation stopped. Request a fresh proposal.",
  };
  return (
    <div
      className="mt-3 rounded-xl border border-border bg-muted/50 p-3"
      aria-label="Direction approval"
    >
      <p className="text-xs font-medium text-foreground" role="status">
        {labels[status]}
      </p>
      {error && status !== "completed" && (
        <p className="mt-2 text-xs leading-5 text-destructive" role="alert">
          {error}
        </p>
      )}
      {status === "failed" && (
        <>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Keep the same brief and prepare a fresh direction for your review.
          </p>
          <button
            type="button"
            disabled={busy || !onDecision}
            onClick={() => onDecision?.(message, "refresh", "")}
            className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs disabled:opacity-50"
          >
            Refresh proposal
          </button>
        </>
      )}
      {status === "pending" && (
        <>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Review the proposed direction above. The team will wait before
            creating.
          </p>
          {revising ? (
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (feedback.trim())
                  onDecision?.(message, "reject", feedback.trim());
              }}
            >
              <label
                htmlFor={`approval-feedback-${message.id}`}
                className="text-xs font-medium"
              >
                What should change?
              </label>
              <textarea
                id={`approval-feedback-${message.id}`}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                maxLength={4000}
                required
                disabled={busy}
                className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The revised direction will need your approval too.
              </p>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || !feedback.trim() || !onDecision}
                  className="rounded-lg bg-foreground px-3 py-2 text-xs text-background disabled:opacity-50"
                >
                  Send changes
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setRevising(false)}
                  className="px-3 py-2 text-xs"
                >
                  Back
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !onDecision}
                onClick={() => onDecision?.(message, "approve", "")}
                className="rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-50"
              >
                Approve &amp; create
              </button>
              <button
                type="button"
                disabled={busy || !onDecision}
                onClick={() => setRevising(true)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs disabled:opacity-50"
              >
                Request changes
              </button>
              <button
                type="button"
                disabled={busy || !onDecision}
                onClick={() => onDecision?.(message, "reject", "")}
                className="px-2 py-2 text-xs text-muted-foreground disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
