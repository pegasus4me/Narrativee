"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { API_URL } from "../../../lib/api-config";
import { useGTMTracking } from "../../hooks/useGTMTracking";
import { usePostHog } from "posthog-js/react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [joined, setJoined] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [error, setError] = useState("");
  const { trackEvent } = useGTMTracking();
  const posthog = usePostHog();
  const hasTrackedTypingRef = useRef(false);

  function handleEmailFocus() {
    posthog?.capture("waitlist_email_focused", {
      location: "landing_hero",
    });
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setEmail(value);

    // Track the first moment a visitor starts typing their email
    if (value.trim().length > 0 && !hasTrackedTypingRef.current) {
      hasTrackedTypingRef.current = true;
      posthog?.capture("waitlist_email_typing_started", {
        location: "landing_hero",
      });
      trackEvent({ eventName: "waitlist_typing_started" });
    }
  }

  function handleEmailBlur() {
    if (email.trim().length > 0) {
      posthog?.capture("waitlist_email_blurred", {
        location: "landing_hero",
        email_length: email.trim().length,
        has_at_symbol: email.includes("@"),
        domain: email.includes("@") ? email.split("@")[1] : undefined,
      });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");

    const trimmedEmail = email.trim();
    const params = new URLSearchParams(window.location.search);
    const campaign = Object.fromEntries(
      (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const)
        .map((key) => [key, params.get(key)?.slice(0, key === "fbclid" ? 1024 : 200)])
        .filter((entry) => entry[1]),
    );

    posthog?.capture("waitlist_submit_attempt", {
      email: trimmedEmail,
      has_company_url: Boolean(companyUrl),
      ...campaign,
    });

    try {
      const response = await fetch(`${API_URL}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          companyUrl,
          utmSource: campaign.utm_source,
          utmMedium: campaign.utm_medium,
          utmCampaign: campaign.utm_campaign,
          utmContent: campaign.utm_content,
          utmTerm: campaign.utm_term,
          fbclid: campaign.fbclid,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Unable to join the waitlist. Please try again.");
      }
      const result = (await response.json()) as { created: boolean };
      if (result.created) trackEvent({ eventName: "waitlist_signup" });

      // Identify user in PostHog so previous anonymous landing session is linked
      posthog?.identify(trimmedEmail, {
        email: trimmedEmail,
        waitlist_joined: true,
        waitlist_created: result.created,
        joined_at: new Date().toISOString(),
        ...campaign,
      });

      posthog?.capture("waitlist_signup_success", {
        email: trimmedEmail,
        created: result.created,
        ...campaign,
      });

      setJoined(true);
      setShowReward(true);
      setEmail("");
    } catch (cause) {
      const errorMessage =
        cause instanceof Error && cause.message !== "Failed to fetch"
          ? cause.message
          : "Can’t reach the server right now. Please try again.";
      setError(errorMessage);
      posthog?.capture("waitlist_signup_error", {
        email: trimmedEmail,
        error: errorMessage,
      });
    } finally {
      setPending(false);
    }
  }

  if (joined) {
    return (
      <>
        <p role="status" className="text-[17px] font-medium text-[#f3f3f3]">You’re on the list. We’ll be in touch when access opens.</p>
        <Dialog.Root open={showReward} onOpenChange={setShowReward}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-40px)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#151515] p-7 text-left text-[#f3f3f3] outline-none sm:p-9">
              <Dialog.Title className="sr-only">You’re in.</Dialog.Title>
              <div className="relative -ml-3 aspect-[9/4] w-full max-w-[360px] overflow-hidden sm:-ml-4 sm:max-w-[400px]" aria-hidden="true">
                <video
                  src="/you-re-in.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <p className="mt-4 text-[52px] font-medium leading-none tracking-[-0.06em]">300 credits</p>
              <Dialog.Description className="mt-4 text-[16px] leading-[1.5] text-[#aaa]">
                Your place on the waitlist is saved. Your credits are reserved for when early access opens.
              </Dialog.Description>
              <Dialog.Close className="mt-8 cursor-pointer rounded-md bg-[#f3f3f3] px-5 py-3 text-[15px] font-semibold text-[#050505] hover:bg-white">
                Got it
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[540px]">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row" aria-label="Join the Narrativee waitlist">
        <label className="sr-only" htmlFor="waitlist-email">Email address</label>
        <input
          id="waitlist-email"
          type="email"
          name="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          maxLength={320}
          value={email}
          onChange={handleEmailChange}
          onFocus={handleEmailFocus}
          onBlur={handleEmailBlur}
          placeholder="Enter your email"
          data-ph-capture-attribute="waitlist-email-input"
          className="min-w-0 flex-1 rounded-md border border-[#606060] bg-[#050505]/75 px-4 py-3 text-[15px] text-white outline-none placeholder:text-[#aaa] focus:border-white"
        />
        <div className="absolute -left-[10000px]" aria-hidden="true">
          <label htmlFor="waitlist-company-url">Company URL</label>
          <input id="waitlist-company-url" type="text" tabIndex={-1} autoComplete="off" value={companyUrl} onChange={(event) => setCompanyUrl(event.target.value)} />
        </div>
        <button
          type="submit"
          disabled={pending}
          data-ph-capture-attribute="waitlist-submit-button"
          className="cursor-pointer rounded-md bg-[#f3f3f3] px-5 py-3 text-[15px] font-semibold whitespace-nowrap text-[#050505] transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Joining…" : "Join the waitlist"}
        </button>
      </form>
      <p className="mt-3 text-[13px] font-semibold text-[#d0d0d0]">Join the waitlist to receive 300 credits grants when we go live.</p>
      {error && <p role="alert" className="mt-3 text-[13px] text-[#f1a9a9]">{error}</p>}
    </div>
  );
}
