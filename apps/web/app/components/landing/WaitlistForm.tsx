"use client";

import {
  useState,
  useRef,
  useId,
  type FormEvent,
  type ChangeEvent,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { API_URL } from "../../../lib/api-config";
import { useGTMTracking } from "../../hooks/useGTMTracking";
import { usePostHog } from "posthog-js/react";

type WaitlistSurveyAnswers = {
  role: string;
  firstUseCase: string;
  currentWorkflow: string;
  mainPain: string;
  founderConversation: boolean;
};

const emptySurveyAnswers: WaitlistSurveyAnswers = {
  role: "",
  firstUseCase: "",
  currentWorkflow: "",
  mainPain: "",
  founderConversation: false,
};

export default function WaitlistForm({
  location = "landing_hero",
  dark = false,
}: {
  location?: string;
  dark?: boolean;
}) {
  const formId = useId();
  const [email, setEmail] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [joined, setJoined] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [surveyAnswers, setSurveyAnswers] =
    useState<WaitlistSurveyAnswers>(emptySurveyAnswers);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveyPending, setSurveyPending] = useState(false);
  const [surveyError, setSurveyError] = useState("");
  const [joinedEmail, setJoinedEmail] = useState("");
  const [attribution, setAttribution] = useState<{
    utmSource?: string;
    utmCampaign?: string;
  }>({});
  const [error, setError] = useState("");
  const { trackEvent } = useGTMTracking();
  const posthog = usePostHog();
  const hasTrackedTypingRef = useRef(false);

  function handleEmailFocus() {
    posthog?.capture("waitlist_email_focused", {
      location,
    });
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setEmail(value);

    // Track the first moment a visitor starts typing their email
    if (value.trim().length > 0 && !hasTrackedTypingRef.current) {
      hasTrackedTypingRef.current = true;
      posthog?.capture("waitlist_email_typing_started", {
        location,
      });
      trackEvent({ eventName: "waitlist_typing_started" });
    }
  }

  function handleEmailBlur() {
    if (email.trim().length > 0) {
      posthog?.capture("waitlist_email_blurred", {
        location,
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
      (
        [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
          "fbclid",
        ] as const
      )
        .map((key) => [
          key,
          params.get(key)?.slice(0, key === "fbclid" ? 1024 : 200),
        ])
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
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          body.error || "Unable to join the waitlist. Please try again.",
        );
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
      setJoinedEmail(trimmedEmail);
      setAttribution({
        utmSource: campaign.utm_source,
        utmCampaign: campaign.utm_campaign,
      });
      setSurveyAnswers(emptySurveyAnswers);
      setSurveySubmitted(false);
      setEmail("");
      posthog?.capture("waitlist_survey_opened", {
        waitlist_created: result.created,
        ...campaign,
      });
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

  function updateSurveyAnswer(
    key: keyof WaitlistSurveyAnswers,
    value: string | boolean,
  ) {
    setSurveyAnswers((current) => ({ ...current, [key]: value }));
  }

  async function submitSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (surveySubmitted || surveyPending) return;

    setSurveyPending(true);
    setSurveyError("");
    posthog?.capture("waitlist_survey_submit_attempt");

    try {
      const response = await fetch(`${API_URL}/waitlist/survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: joinedEmail,
          ...surveyAnswers,
          ...attribution,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          body.error || "Could not save your answers. Please try again.",
        );
      }

      const result = (await response.json()) as { completed: boolean };
      if (!result.completed) {
        throw new Error("Could not confirm your survey. Please try again.");
      }

      posthog?.capture("waitlist_survey_completed", {
        role: surveyAnswers.role,
        first_use_case: surveyAnswers.firstUseCase,
        current_workflow: surveyAnswers.currentWorkflow,
        main_pain: surveyAnswers.mainPain,
        founder_conversation: surveyAnswers.founderConversation,
      });
      setSurveySubmitted(true);
    } catch (cause) {
      const errorMessage =
        cause instanceof Error && cause.message !== "Failed to fetch"
          ? cause.message
          : "Can’t reach the server right now. Please try again.";
      setSurveyError(errorMessage);
      posthog?.capture("waitlist_survey_submit_error", { error: errorMessage });
    } finally {
      setSurveyPending(false);
    }
  }

  if (joined) {
    return (
      <>
        <p
          role="status"
          className={`text-[17px] font-medium ${dark ? "text-white" : "text-[#171717]"}`}
        >
          You’re on the list. We’ll be in touch when access opens.
        </p>
        <Dialog.Root
          open={showReward}
          onOpenChange={(open) => {
            if (!open && !surveySubmitted)
              posthog?.capture("waitlist_survey_skipped");
            setShowReward(open);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-32px)] max-w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white [color-scheme:light] p-6 text-left text-[#171717] outline-none sm:p-8">
              {surveySubmitted ? (
                <>
                  <Dialog.Title className="text-[26px] font-medium tracking-[-0.04em]">
                    Thanks for helping shape Narrativee.
                  </Dialog.Title>
                  <Dialog.Description className="mt-3 text-[15px] leading-[1.5] text-[#595959]">
                    Your place is saved, and your 300 credits are reserved for
                    early access.
                  </Dialog.Description>
                  <Dialog.Close className="mt-7 cursor-pointer rounded-md bg-[#171717] px-5 py-3 text-[15px] font-semibold text-white hover:bg-[#333333]">
                    Done
                  </Dialog.Close>
                </>
              ) : (
                <>
                  <Dialog.Title className="text-[26px] font-medium tracking-[-0.04em]">
                    You’re on the waitlist.
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-[15px] leading-[1.5] text-[#595959]">
                    Complete these 5 quick questions to reserve your 300 credits
                    and help us build for teams like yours.
                  </Dialog.Description>
                  <form onSubmit={submitSurvey} className="mt-6 space-y-4">
                    <label className="block text-[14px] font-medium">
                      What best describes your role?
                      <select
                        required
                        value={surveyAnswers.role}
                        onChange={(event) =>
                          updateSurveyAnswer("role", event.target.value)
                        }
                        className="mt-2 w-full rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-[14px] text-[#171717]"
                      >
                        <option value="" disabled>
                          Select one
                        </option>
                        <option value="founder">
                          Founder / business owner
                        </option>
                        <option value="marketing">Marketing / growth</option>
                        <option value="designer">Designer / creative</option>
                        <option value="agency">Agency / consultant</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="block text-[14px] font-medium">
                      What would you most want to create?
                      <select
                        required
                        value={surveyAnswers.firstUseCase}
                        onChange={(event) =>
                          updateSurveyAnswer("firstUseCase", event.target.value)
                        }
                        className="mt-2 w-full rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-[14px] text-[#171717]"
                      >
                        <option value="" disabled>
                          Select one
                        </option>
                        <option value="campaign">Campaign visuals</option>
                        <option value="social">Social content</option>
                        <option value="launch">Launch creative</option>
                        <option value="identity">Brand identity</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="block text-[14px] font-medium">
                      How do you make those assets today?
                      <select
                        required
                        value={surveyAnswers.currentWorkflow}
                        onChange={(event) =>
                          updateSurveyAnswer(
                            "currentWorkflow",
                            event.target.value,
                          )
                        }
                        className="mt-2 w-full rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-[14px] text-[#171717]"
                      >
                        <option value="" disabled>
                          Select one
                        </option>
                        <option value="self">I make them myself</option>
                        <option value="design_tool">
                          Canva or another design tool
                        </option>
                        <option value="image_ai">Image-generation AI</option>
                        <option value="freelancer">Freelancer or agency</option>
                        <option value="in_house">
                          In-house designer / team
                        </option>
                      </select>
                    </label>
                    <label className="block text-[14px] font-medium">
                      What’s the biggest frustration?
                      <select
                        required
                        value={surveyAnswers.mainPain}
                        onChange={(event) =>
                          updateSurveyAnswer("mainPain", event.target.value)
                        }
                        className="mt-2 w-full rounded-md border border-[#d4d4d4] bg-white px-3 py-3 text-[14px] text-[#171717]"
                      >
                        <option value="" disabled>
                          Select one
                        </option>
                        <option value="brand_fit">
                          Keeping everything on-brand
                        </option>
                        <option value="time">It takes too long</option>
                        <option value="quality">Getting usable quality</option>
                        <option value="cost">Cost of design help</option>
                        <option value="starting">
                          Starting from a blank page
                        </option>
                      </select>
                    </label>
                    <label className="flex items-start gap-3 text-[14px] leading-[1.45] text-[#525252]">
                      <input
                        type="checkbox"
                        checked={surveyAnswers.founderConversation}
                        onChange={(event) =>
                          updateSurveyAnswer(
                            "founderConversation",
                            event.target.checked,
                          )
                        }
                        className="mt-1 accent-[#171717]"
                      />
                      I’m open to a short conversation with the founder about my
                      workflow.
                    </label>
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <Dialog.Close className="cursor-pointer text-[14px] text-[#666666] hover:text-black">
                        Skip
                      </Dialog.Close>
                      <button
                        type="submit"
                        disabled={surveyPending}
                        className="cursor-pointer rounded-md bg-[#171717] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#333333] disabled:cursor-wait disabled:opacity-60"
                      >
                        {surveyPending ? "Saving…" : "Send answers"}
                      </button>
                    </div>
                    {surveyError && (
                      <p role="alert" className="text-[13px] text-[#b42318]">
                        {surveyError}
                      </p>
                    )}
                  </form>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[540px]">
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 sm:flex-row"
        aria-label="Join the Narrativee waitlist"
      >
        <label className="sr-only" htmlFor={`${formId}-email`}>
          Email address
        </label>
        <input
          id={`${formId}-email`}
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
          className="min-w-0 flex-1 rounded-md border border-[#d4d4d4] bg-white/90 px-4 py-3 text-[15px] text-[#171717] outline-none placeholder:text-[#595959] focus:border-[#171717]"
        />
        <div className="absolute -left-[10000px]" aria-hidden="true">
          <label htmlFor={`${formId}-company-url`}>Company URL</label>
          <input
            id={`${formId}-company-url`}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={companyUrl}
            onChange={(event) => setCompanyUrl(event.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          data-ph-capture-attribute="waitlist-submit-button"
          className={`cursor-pointer rounded-md px-5 py-3 text-[15px] font-semibold whitespace-nowrap transition-colors disabled:cursor-wait disabled:opacity-60 ${dark ? "bg-white text-[#171717] hover:bg-[#e5e5e5]" : "bg-[#171717] text-white hover:bg-[#333333]"}`}
        >
          {pending ? "Joining…" : "Join waitlist"}
        </button>
      </form>
      <p
        className={`mt-3 text-[13px] font-semibold ${dark ? "text-[#a3a3a3]" : "text-[#595959]"}`}
      >
        Complete the short survey after joining to reserve 300 credits for early
        access.
      </p>
      {error && (
        <p
          role="alert"
          className={`mt-3 text-[13px] ${dark ? "text-[#f1a9a9]" : "text-[#b42318]"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
