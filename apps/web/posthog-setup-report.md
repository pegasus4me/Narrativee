# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your Narrativee Next.js application. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` using the modern Next.js 15.3+ approach
- **Reverse proxy configuration** in `next.config.js` to route PostHog requests through your domain, avoiding ad blockers
- **Environment variables** configured in `.env` for the PostHog API key and host
- **User identification** on signup and signin with `posthog.identify()`
- **Session reset** on logout with `posthog.reset()` to properly handle user sessions
- **Error tracking** enabled via `capture_exceptions: true`
- **12 custom events** tracking key user actions across the application

## Environment Variables

The following environment variables were added to `.env`:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_cOCA9zK75sqDuz5q0zVbaw6eUFU6CK4z0EydxaI50iU
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Events Tracked

| Event Name | Description | File(s) |
|------------|-------------|---------|
| `user_signed_up` | Tracks when a user successfully creates a new account via email or Google OAuth | `app/auth/signup/page.tsx` |
| `user_signed_in` | Tracks when a user successfully signs in via email or Google OAuth | `app/auth/signin/page.tsx` |
| `user_logged_out` | Tracks when a user logs out and resets PostHog identification | `app/components/ProfileMenu.tsx`, `app/components/SidebarProfile.tsx`, `app/setting/page.tsx` |
| `cta_clicked` | Tracks when a user clicks on a call-to-action button (hero section or footer) | `app/page.tsx` |
| `file_uploaded` | Tracks when a user uploads a CSV or Excel file for report generation | `app/components/FileUploadPrompt.tsx` |
| `report_generated` | Tracks when a report is successfully generated from uploaded data | `app/create/page.tsx` |
| `pricing_plan_selected` | Tracks when a user selects a pricing plan to checkout | `app/pricing/page.tsx` |
| `checkout_completed` | Tracks when a user completes the checkout/payment process | `app/success/page.tsx` |
| `report_shared` | Tracks when a user shares a report via the share modal | `app/components/ShareModal.tsx` |
| `shared_report_viewed` | Tracks when someone views a shared report via a share link | `app/share/[shareId]/page.tsx` |
| `chat_message_sent` | Tracks when a user sends a message in the AI chat sidebar | `app/components/ChatSidebar.tsx` |
| `feedback_submitted` | Tracks when a user submits feedback through the feedback popup | `app/components/FeedbackPopup.tsx` |

## Files Modified

| File | Changes |
|------|---------|
| `instrumentation-client.ts` | Updated PostHog initialization with reverse proxy and environment variables |
| `next.config.js` | Added rewrites for PostHog reverse proxy |
| `.env` | Created with PostHog environment variables |
| `app/components/ProfileMenu.tsx` | Added logout event and reset |
| `app/components/SidebarProfile.tsx` | Added logout event and reset |
| `app/setting/page.tsx` | Added logout event and reset |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/270005/dashboard/926226) - Your main dashboard with all key metrics

### Insights
- [User Signups Over Time](https://us.posthog.com/project/270005/insights/VQQam0PS) - Track new user registrations daily
- [Signup to Report Generation Funnel](https://us.posthog.com/project/270005/insights/mhsMFSwm) - Conversion funnel from signup -> file upload -> report generation
- [Report Generation Activity](https://us.posthog.com/project/270005/insights/ezhw73Vl) - Daily report generation metrics
- [Pricing Plan Selection](https://us.posthog.com/project/270005/insights/ZMGrggjw) - Track which pricing plans users are selecting (broken down by plan)
- [User Engagement (Chat & Feedback)](https://us.posthog.com/project/270005/insights/jBQ1eklS) - Track chat messages and feedback submissions

## Configuration Notes

- PostHog is configured with `capture_exceptions: true` for automatic error tracking
- Debug mode is enabled in development for easier testing
- The `defaults: '2025-05-24'` setting enables automatic pageview capture on route changes
- User identification happens on both email signup/signin (using email as distinct_id)
- The reverse proxy routes requests through `/ingest` to avoid ad blockers
