<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into the Narrativee backend (Express.js/TypeScript, `apps/backend`). A new PostHog client singleton was created at `src/lib/posthog.ts` and imported across five backend files. Events are captured at every major user action — from account creation through content generation, publishing, and subscription management. User identification is performed server-side on signup. A global Express error handler captures unhandled errors via `captureException`, and graceful shutdown handlers flush the event queue on `SIGINT`/`SIGTERM`.

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | New user account created; also triggers server-side `identify` | `src/auth/auth.ts` |
| `channel_connected` | Social channel connected via OAuth or Bluesky credentials | `src/routes/channels.ts` |
| `channel_disconnected` | Social channel disconnected | `src/routes/channels.ts` |
| `source_added` | Substack or RSS blog added as a content source | `src/routes/sources.ts` |
| `source_removed` | Content source removed | `src/routes/sources.ts` |
| `angles_extracted` | AI extracted atomic content angles from an article | `src/routes/articles.ts` |
| `drafts_generated` | AI generated social media drafts for selected angles | `src/routes/articles.ts` |
| `post_scheduled` | Draft post scheduled for future publishing | `src/routes/articles.ts` |
| `post_published` | Post published immediately to a social channel | `src/routes/articles.ts` |
| `post_deleted` | Draft post deleted | `src/routes/articles.ts` |
| `checkout_session_created` | User initiated a Stripe checkout session | `src/routes/pricing.ts` |
| `subscription_started` | Stripe webhook: checkout completed, subscription active | `src/routes/pricing.ts` |
| `subscription_renewed` | Stripe webhook: subscription renewal payment succeeded | `src/routes/pricing.ts` |
| `subscription_canceled` | Stripe webhook: subscription canceled | `src/routes/pricing.ts` |

## Next steps

We've built a dashboard and five insights to monitor user behavior and business health:

- [Analytics basics dashboard](/dashboard/693775)
- [Content pipeline conversion funnel](/insights/iFECP83h) — signup → source added → channel connected → drafts generated → post published
- [New signups over time](/insights/LI5F5dFF) — daily new user registrations
- [Content generation activity](/insights/E4fSDbdF) — daily angle extractions and draft generations
- [Posts scheduled and published](/insights/tQ6mUqMo) — daily publishing momentum
- [Subscription events](/insights/LhsjrH7Y) — weekly subscription starts vs cancellations

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
