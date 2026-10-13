# Brand flow checks

Run from `apps/backend` against an **empty, disposable** database named `brand_flow_test`:

```sh
TEST_DATABASE_URL=postgresql://postgres:password@127.0.0.1:55439/brand_flow_test pnpm test:brands
```

The test applies the existing baseline and additive brand migrations, uses real Better Auth email sessions and HTTP endpoints, and checks ownership, guest claims, replayed/concurrent creation, legacy links, and persistence across sessions. It also checks owner-only brand removal, cascading deletion of research/messages/projects/Brand Brain, archived-image file cleanup, and isolation of other brands. Scraping/LLM execution is replaced with a counter: no external provider calls are made. The database is deliberately not cleared by the test; recreate the disposable database before another run. A unique `brand_flow_test_*` database name is also accepted.

Apply the schema to an application database before deploying the new routes:

```sh
pnpm db:migrate-brands
```

This uses `LOCAL_DATABASE_URL`, falling back to `DATABASE_URL`, and runs the additive application migrations through 0023 transactionally and idempotently. It does not replay the unrelated old Drizzle history, which is incomplete in this repository.

## Product library

Run `node --import tsx scripts/run-billing-tests.ts products` against a configured local Postgres connection. The runner refuses remote hosts and creates/drops only its disposable `brand_products_test_*` database. The test covers authenticated product creation and editing, multiple private photos, cross-brand isolation enforced in both routes and the database, image validation, grouped agent context, and product/photo archiving. Migration 0023 must be applied before deploying these routes. The `campaign` suite additionally checks that Research and Creator receive product descriptions through the normal campaign flow with mocked providers.

New accounts receive 80 credits once, with a trial ending 168 hours after signup. Existing accounts are not enrolled retroactively. Authenticated AI requests check the live trial expiry and balance; saved work remains readable. `GET /api/usage` returns the caller's balance and trial status. Credit deductions await the agreed conversion from actual provider usage to credits.

```sh
TEST_DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/trial_flow_test_local node --import tsx --test tests/trial-flow.test.ts
```

Use an empty disposable `trial_flow_test_*` database. The check covers real email signup and login, server-controlled grants, migration replay, account isolation, expiry and empty-balance gates without paid provider calls.

Studio replies persist the replying agent in migration 0014. Each reply displays only its author's avatar/name during streaming and after reopening. The single Studio conversation shows all saved channels; legacy agent-specific API channels remain supported. Migration 0015 stores an independent chat channel on both sides of every exchange. Legacy API callers can still address individual agents and receive their own dialogue plus shared recent project discussions, Brand Brain and canvas context. The current UI does not expose separate specialist chats. Old messages stay in the Team chat; reply author identity remains separate from chat destination. The HTTP tests verify chat destinations, shared context, follow-up context, reopening across sessions, and failed exchanges without partial saves. Legacy replies without attribution have no author label. Studio HTTP tests check each agent's saved identity and null attribution on older messages; campaign checks verify Pixel authors generated creatives.

Agents collaborate through native Responses function calls. Any agent can consult another specialist, consume the returned findings, and ask for a revision or review. Each specialist uses its own saved model and instructions. Agent requests and specialist findings appear live as named messages in Creative Team and persist there on reopening. Exchanges involving collaboration move to Creative Team; direct questions without delegation stay in the selected individual chat. Shared context stays within the project; agent proposals do not become approved Brand Brain rules. Scout works from supplied evidence and saved research; delegation does not perform a new website scan. Runs allow six tasks, two levels of delegation, and one visual proposal. Simple questions can finish without delegation.

Type `@` in the Studio prompt to select Scout, Sage or Pixel using the mouse, arrow keys and Enter/Tab; Escape dismisses the menu. Multiple tags explicitly consult the named teammates before the addressed agent replies, using their own preferences and actual findings. The first tag addresses the reply in Team; a specialist chat keeps its selected agent. All collaborators appear in Creative Team and persist with their names. Duplicate tags run once; email/URL fragments and code examples do not recruit agents. Mentions never bypass human approval. Parser, collaboration, interactive prompt and HTTP checks cover these behaviors without paid provider calls.

In creation mode, Sage and Scout can ask Pixel to propose artwork with the chosen direction and specialist findings. The original user request must authorize that kind of new visual. The existing campaign/identity planning and brand review checks still apply; the original brief is saved once, with each actual contributor identified separately. Unit checks cover tool results, nested consultation, specialist preferences, bounded loops and failures. The campaign HTTP test exercises Sage consulting Scout and Pixel, preparing a reviewed direction, waiting for a human decision, executing the approved saved plan through the mocked provider pipeline, and reopening all authors. No paid provider calls are made.

```sh
node --import tsx --test tests/agent-mentions.test.ts tests/agent-collaboration.test.ts
```

Human approval (migration 0018) is required before campaign artwork generation, asset copying or logo geometry generation, including direct Pixel requests and delegated Sage/Scout requests. The reviewed campaign plan or identity directions are saved privately on the proposal message; the chat shows the proposed choices and **Approve & create**, **Request changes** and **Decline** actions. Approval is an authenticated explicit decision for that message, never inferred from agent text. A short row-locked transaction claims it once and records the approving user and time before provider work. Approval executes the saved direction without replanning. Requested changes produce a fresh pending proposal; replaced/declined proposals cannot execute. Changes to brand context or actual canvas artwork require fresh approval. New proposals fingerprint canvas content: zoom, pan, favorites, Fabric version metadata and identical autosaves do not invalidate the reviewed plan. Layer edits, reference replacements, layer order and backgrounds invalidate it at approval preflight. Once generation starts, finished images append to the current canvas so later edits do not discard new outputs. Older proposals without a fingerprint retain their strict revision check. Failure preserves the proposal and prior canvas and requires a fresh proposal rather than automatically retrying a possibly completed action. Pending decisions survive reopening. HTTP checks cover campaign and logo gates, view-only autosaves, no generation before approval, revisions, declines, replay, concurrent clicks, ownership, payload tampering and stale canvas; UI checks cover decision payloads and controls/status persistence. Unit checks in `tests/visual-approval.test.ts` cover canvas fingerprints and the legacy fallback.

Agent settings (migration 0016) are saved per brand and agent. Clicking a sidebar agent opens its chat; only its dedicated settings icon opens settings. The canvas selector also opens the conversation directly. Conversation model choices come from the configured OpenAI account’s general reasoning models; only models with configured verified rates remain available if the model catalog cannot be loaded. Model, response length and custom instructions apply to agent chat replies, including both streaming paths. Migration 0017 adds Pixel’s image and video model preferences. The image choice is used for complete creative images; video choices are saved but marked as coming soon because there is no video generation pipeline yet. Conversation, image, and video options are validated separately. The multi-agent planning pipeline retains its existing text models. HTTP checks cover persistence across projects/sessions, agent/brand isolation, authorization, model validation, reset, deletion cleanup, and the actual model and instruction payload sent to the provider.

Brand records are accessed through Express and Better Auth. Supabase Data API roles have no direct access to brand or analysis tables. Anonymous legacy analyses remain readable through the old API, but cannot be claimed using only an analysis ID. New guest brands require their HttpOnly cookie; claims invalidate guest access.

Discovery shows the saved diagnosis and requires competitor confirmation before running the comparison. Google callback destinations use the same constrained return-path resolver as email auth; live Google OAuth still needs a manual check with the configured provider.

## Brand Brain checks

```sh
pnpm test:brand-brain
```

Checks website normalization, evidence boundaries, manual-choice priority, archives, image validation, SVG rasterization, private-network URL rejection, and private development storage. No paid provider calls are made.

The database/HTTP test skips unless `TEST_DATABASE_URL` points to an **empty, disposable** database named `brand_brain_sync_test_*`:

```sh
TEST_DATABASE_URL=postgresql://postgres:password@127.0.0.1:55439/brand_brain_sync_test_local node --import tsx --test tests/brand-brain-sync.test.ts
```

It uses real Better Auth sessions and mocked scraping/LLM responses to verify automatic Discovery population, explicit backfill, approvals, ownership checks, duplicate prevention, archived findings, image failure recovery, and designer context. Recreate the disposable database before another run; never point this test at an application database.

## Creative image and canvas checks

```sh
pnpm test:campaign
```

Contract tests cover image art-direction plans, output selection, native GPT Image 2 sizes, image authorization, and unsafe Fabric snapshots. Legacy canvas contracts still cover editable fonts, geometry, and contrast for existing saved work; those checks do not compose new generated creatives.

The HTTP test skips unless `TEST_DATABASE_URL` names an **empty, disposable** `campaign_flow_test_*` database. It exercises authenticated routes with mocked OpenAI and Jev: clarification, Scout's handoff, actual logo/product reference pixels, one complete image per selected output, exact PNG dimensions, private ownership, save/reopen, revision conflicts, failure cleanup, and brand deletion. Output selections survive requested changes and concurrent approval. Old vector/layout proposals are replaced with pending image directions. New logo requests use the image pipeline. No paid model calls are made by these tests. Finished-image checks verify actual vision input, structured reference accounting, one targeted correction with the previous PNG plus original references, persisted Sage feedback in Team, and delivery of drafts if visual review is unavailable.

Sage reviews the image direction before human approval. Concrete concerns receive one refinement and then become normal Creative Team feedback. Approval executes the saved direction without repeating the subjective review. Billing tests meter both image generation and multipart reference-image calls, settle actual text/image usage, and refund missing usage and failures. Mocked providers do not establish live image quality.

For manual review, open Studio, select a product or upload a photo, describe the desired scene and select formats in the Outputs popup. Custom output sizes accept whole pixels from 64 to 4096 per side with aspect ratios between 1:3 and 3:1. Check the displayed upper credit bound and click Generate. Select an existing creative and describe a correction to use Apply changes; the original is retained. Each selected output generates one complete PNG containing its text, graphics, and imagery. It can be moved, resized, saved, reopened, and exported; individual elements are not editable until a later decomposition tool is added. Generation follows brand typography direction without needing a downloadable font. Supplied imagery is passed to the image model as references, and generated work is **not** approved into Brand Brain automatically. Platform selection does not publish assets.

Canvas checks reuse Fabric's installed Node renderer and the existing backend TypeScript runner:

```sh
# From apps/backend
TSX_TSCONFIG_PATH=../web/tests/tsconfig.json node --import tsx --test ../web/tests/*.test.ts ../web/tests/*.test.tsx
```

These check square, portrait, vertical, landscape and pin PNG dimensions and actual pixels, separate editable layers, text overflow without partial insertion, existing-work preservation, private image-fetch deduplication, captured edits during unmount, and conflict-safe autosaving. Rendering fixtures use a system font; they do not verify live Google Font delivery or substitute for human quality review.

Text fitting measures Fabric's loaded font and keeps the largest fitting size within the planned box (headings stay at least 24px, body text at least 12px). It preserves wording, explicit line breaks, font, color, and editable text rather than clipping or scaling a bitmap. Regression fixtures include “SODA, WITH MORE TO LOVE.”, an unbroken word that initially expands Fabric's width, multiline copy, unchanged readable text, and corrected sizes surviving save/reopen and PNG export. A box that cannot fit readable text still fails atomically without altering existing canvas work; the error identifies a designer layout problem, not a bad user brief. Image providers and generation settings are unchanged.

Studio's Creator prompt includes a paperclip upload for PNG/JPEG/WebP images up to 8 MB. Uploads are private project assets, inserted as independently editable images and saved before the upload completes. They are not promoted into Brand Brain. Campaign planning receives actual thumbnail pixels from up to twelve saved uploads/brand references, with up to five explicitly selected image attachments per new creative and may reuse authorized project asset IDs without regenerating or duplicating them. Removing an uploaded image from the canvas removes it from future campaign context; the private file remains project-owned until brand deletion. The authenticated HTTP test verifies upload ownership, malformed/spoofed/oversized files, image access, pixel references, direct asset reuse, unchanged brand rules and deletion cleanup. Fabric tests verify upload placement, transformations, reopening, and failure preservation. UI tests cover the tertiary working border, authenticated upload requests and storage errors.

New campaign replies include a client-facing design approach plus actual font/palette/imagery details, and identity exploration explains each direction's strategic and mark approach. Creator conversation reads saved canvas metadata and recent explanations, so follow-up questions about choices do not need a fresh generation. This is a design justification, not hidden chain-of-thought or a claim to have seen a canvas screenshot. Tests verify the context boundary and follow-up access to the saved approach. GPT Image settings remain unchanged.

The local schema migration, contract/HTTP tests, and type checks do not establish visual quality. Review three real briefs in Studio, verify editing/save/reopen and exported dimensions, and require at least two compositions to be usable without rebuilding them. Record duration and image-call count from the `Studio campaign` logs. The initial OLIPOP review remains pending; it can now proceed with explicitly disclosed provisional typography without changing its official Brand Kit.

Stale approval recovery: a preflight mismatch prepares an updated proposal without image generation, and the new card requires human approval. Failed cards expose Refresh proposal, retaining the original brief and selected output set. Legacy revision-only proposals can be refreshed into fingerprinted proposals without bypassing approval. Provider failures never automatically rerun image creation. Mocked HTTP tests cover stale canvas changes, failed legacy cards, recovery and subsequent approval. Creator errors distinguish classifier outages, agent-model access, rate limits, exhausted provider credits and timeouts without returning private provider payloads.

## Credits and paid billing

Run `pnpm test:billing` for isolated Postgres tests with mocked provider and Stripe responses. The runner creates and drops its own local database. Run `node --import tsx scripts/run-billing-tests.ts trial` for signup and direct API gates. See [billing rollout](../../../docs/launch/billing.md) for real Stripe test-mode acceptance and production prerequisites. The ledger in migration 0021 is authoritative; tests that simulate exhaustion update `credit_bucket`, not the legacy integer user field.

`campaign-quality.test.ts` covers structured direction-to-prompt rendering, explicit reference use/omission accounting, inspiration boundaries, actual finished-image vision input, ordered multipart edit attachments, bounded corrections, review/provider/credit failures and rejection of corrections that regress. `campaign-schema.test.ts` validates the strict new provider planning schema separately from backward-compatible saved image plans. The mocked HTTP flow verifies correction reviews are metered and persisted through the normal approval endpoint. These tests establish workflow behavior, not premium visual quality.

## Single-workflow checks

`campaign-generation.test.ts` verifies explicit product/reference selection, style roles, direct generation without mandatory research or a proposal, clarification without an image call, source-image edits and version metadata, and conservative credit bounds. The disposable `campaign` HTTP suite also exercises authenticated direct requests, cost estimates, private source selection, original-image preservation after retouching, and rejection of an image from another project. These tests use mocked image providers and establish workflow behavior, not live visual quality. `tests/studio-brief.test.tsx` in the web app checks the one composer, visible product photos, direct request payload, retouch selection and missing-product-photo gate.
