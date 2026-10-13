# Narrativee

**A shared creative workspace that turns an idea into campaign-ready assets—and uses confirmed feedback to make the next campaign easier.**

Narrativee helps **small businesses and agencies** choose a product, describe the image they want, and refine it in one creative workspace. The human controls the scene and visual expectations. Agents translate the brief, generate the image, and inspect the finished pixels using the selected references and brand context.

The customer promise is **publishable creatives with less fixing, without repeating the same feedback every week**. Design quality is essential; the recurring value to prove is less effort to complete each campaign.

The core is **one human → one project conversation → coordinated agents**. The user does not choose an agent or switch between Discovery and Creation. Agent activity and handoffs remain visible as expandable details.

## Initial beta delivery target

**Original public beta target: Thursday, October 8, 2026.** This date records the initial delivery plan; it does not establish production release status or a new deadline for the product directives below.

**Current release target: Tuesday, October 13, 2026.** Keep this release focused on a usable static-creative workflow and manual product entry. Automated Shopify import comes later. Production workflows now gate deployment on lightweight tests, build validation and a check of the served release; see [deployment](docs/launch/deployment.md).

Replace the waitlist with **Try Narrativee** and let people sign up and complete a real creative brief. Set an explicit beta generation allowance before launch.

- **Tuesday, October 6:** trial entry, onboarding, Studio layout, and agent coordination.
- **Wednesday, October 7:** real briefs, creative quality, reliability, latency, and generation cost.
- **Thursday, October 8:** deploy and verify the complete production signup-to-export flow.

See the [launch plan](docs/launch/2026-10-08.md) for release gates and verification status. This is a delivery target, not a claim that the beta is already live.

## First customers

Small businesses and agencies that regularly need social posts and ad creatives. They bring an idea of what to promote, a brand, and source materials; they should not need a polished brief or expertise in prompting image models.

A business owner can direct the agents alone. Agencies use the same workflow for client brands, with brand context and confirmed preferences kept separate for each client. Teammate and client participation should fit into the same review process; invitations, shared permissions, and live coediting remain future capabilities.

The first paid outcome is **a coherent campaign package ready for approval or publishing**: creative images, copy and captions, and the required channel formats. Publishing integrations and measurable sales or lead performance are later extensions, rather than conditions for completing this first workflow.

## Single creative workflow

**Product → brief and format → generate → corrections → export.**

1. Open Studio immediately. A new account can start with a minimal brand workspace; a website scan and complete brand review are not prerequisites.
2. Select a product from Brand Brain or upload a product photo. The brief shows the selected product/reference images and distinguishes inspirations from product photos. Up to five selected references are sent to generation.
3. Describe the scene, style, copy and expectations in the same composer, and choose the output formats. Explicit user choices constrain the art direction; unspecified details remain creative freedom. Missing essential information gets one question in the same conversation.
4. Show a verified upper credit bound before the user clicks **Generate**. It includes planning, reviews and one possible automatic image correction per output; actual usage is charged. The new request executes without a second direction-approval step or mandatory Scout research.
5. Select a generated image and describe a change in the same composer. **Apply changes** uses its actual pixels, preserves its intrinsic format, and asks the image reviewer to compare against the original. Retouched versions append to the canvas with a version number and source-image link; the original remains available.
6. Export the chosen image. Brand Brain, product management, image-model settings and approved references remain accessible from the same workspace. Save lasting preferences explicitly in Brand Brain.

Older saved proposals retain their approval/rejection controls and legacy API paths. Existing Discovery project URLs can use the single generation workflow without moving or deleting their saved history. The current implementation still requires live user validation; agent review is not proof of aesthetic quality or ad performance.

## Studio and the agent team

The main workspace sits on the **left**, with Canvas, Brand Brain, and Research views. One side panel holds the project conversation and expandable agent activity. The layout takes inspiration from [Orbit](https://orbit-agent-workspace.vercel.app).

| Agent                        | Responsibility                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Scout — Research**         | Examine supplied brand and competitor evidence, then pass a grounded creative angle to the creator.                    |
| **Sage — Brand & direction** | Check the proposed direction and actual rendered image for product fidelity, copy, hierarchy and brand fit.            |
| **Pixel — Creator**          | Generate the entire creative with GPT Images using the approved direction, brand rules, and supplied image references. |

Agents share context and hand off work. Their visible activity should reflect real steps, including failures. The human remains the creative director.

Agents must improve outcomes within the single workflow. Pixel executes the user's requested scene and Sage checks the plan and finished image. Scout remains available to the research APIs and saved research context; new direct image requests do not automatically call Scout. Agent suggestions cannot replace explicit user instructions. Lasting brand preferences still require explicit confirmation.

Campaign planning uses a validated JSON brief for subject, composition, lighting/materials, typography, palette and reference roles. Eight authored art-direction recipes provide starting points; uploaded inspiration images provide visual examples. These recipes are not a gallery of independently tested ads. Planning can inspect up to twelve supplied references and must account for each as used or explicitly omitted. The final image receives up to five selected reference images with numbered roles, prioritizing relevant real products and logos. The proposal displays reference selections and omission reasons before approval.

GPT Images receives labeled text instructions assembled from that JSON, alongside the reference pixels. Sage then inspects the actual generated PNG. A major observed defect can trigger one targeted edit using that PNG and the original references, followed by a second visual review. Reviews and corrections use credits and are disclosed before approval. Minor suggestions remain review notes. A failed review/correction keeps the generated draft available with Sage's notes in Creative Team. A correction is used only when the review improves without introducing a major defect in a new dimension. Automated checks do not establish aesthetic quality or conversion performance; the human still reviews the final image.

The first manual quality comparison is specified in [the creative quality benchmark](docs/research/creative-quality-benchmark.md).

Current competitor research uses website analysis. It does not establish which ads are active or converting. Ad-library and connected performance data are future capabilities required for those claims.

## Brand Brain and the value to prove

Brand Brain holds rules, inspiration, feedback, and images. Approved rules guide production; inspiration remains a reference. Explicitly saved feedback can guide later work, while conversations and canvas edits do not yet automatically update memory.

**Products** is a separate Brand Brain category. Save a product name, description, and multiple PNG/JPEG/WebP photos (upload, drop, or paste, up to 8 MB per photo). Products and their photos persist per brand and can be edited or removed. Product descriptions and associated photo IDs reach agent context; campaign planning can inspect supplied photos and select relevant references. Product facts are not universal brand rules, and generation should not mix different products. Shopify catalog import is planned; it is not part of this release.

Feedback applies to the current campaign first. Agents should suggest reusable preferences with a clear confirmation such as **“Remember this for this brand?”** A correction such as “use less text on this ad” should not silently become a rule for every future campaign. Confirmed preferences stay specific to the relevant brand, including for agencies managing multiple clients. The suggested-preference confirmation flow remains to be implemented.

The differentiation to test is **continuity across campaigns**: approved examples, creative decisions, and confirmed preferences should reduce later briefing and corrections. Agent count and memory alone do not establish a competitive advantage. Customer validation and a demonstrated advantage over Zeely have not been established yet.

## Subscription and cost directives

Keep **monthly subscriptions with credits**. Show the expected credit cost before generation approval, including agent reviews and possible corrections. Measure the full cost of a real campaign package: research, planning, image generation, reviews, revisions, and failed attempts.

The existing catalog defines Starter at $19/month with 500 credits and Pro at $49/month with 1,500 credits. These configured prices and allowances do not prove the economics of the agreed campaign package. Verify representative usage before promising a number of campaigns per month, and confirm that the trial can support a useful evaluation of the workflow. See [billing rollout and verification](docs/launch/billing.md).

## Customer validation

Test **two real campaign briefs with each of five customers**, including small businesses and agencies. Compare against each customer's existing workflow, including Zeely where they already use it.

Measure:

- Whether the customer actually uses the finished creatives.
- Human time spent briefing, correcting, and approving, including help from the founder.
- Revision rounds and repeated feedback, especially on the second campaign.
- Cost per accepted creative, including retries and corrections.
- Whether the customer returns with another real brief and pays.

The agreed early success test is **at least three of five customers returning and paying, with an observable reduction in effort or corrections**. This is a proposed learning threshold, not market-wide proof. Positive reactions to the agent conversation or demo are insufficient if the customer still has to redesign the work elsewhere.

## Current foundation and release scope

Narrativee is in development. The existing foundation includes Brand Brain, website research, full-image creative generation, saved canvases, private uploads, and PNG export. Existing canvas layers remain supported. The local launch work adds direct trial entry, guided onboarding, coordinated agent handoffs, and the new Studio layout; production release still needs verification.

The release uses one clear product-to-image workflow. Mandatory three-direction exploration and separate specialist conversations have been removed from the creation interface.

Prioritize dependable creative quality, useful revisions that preserve approved elements, and confirmed feedback that improves subsequent work. Generation, saving, reopening, and export must remain reliable. New creatives are single PNG images: copy, typography, and graphics are rendered together. They can be moved and resized; decomposition into separately editable assets is planned for a later version. Live generation/retouch validation, final campaign captions, confirmed preference suggestions, and broader human collaboration still need verification or implementation. Video, UGC production, publishing integrations, and autonomous performance monitoring remain outside the initial static-creative workflow.

See [roadmap.md](roadmap.md) for implementation status and priorities.

- meta ads
- agencies
