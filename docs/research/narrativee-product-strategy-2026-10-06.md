# Narrativee: product direction and comparison with Zeely

Research date: 6 October 2026.

## Recommendation and confidence

Keep the editable Studio and Brand Brain foundations. Focus the next release on helping a small marketing team get from a brief to approved creative with less correction, then use its approved decisions on the next brief. Make conversational revisions work on the actual canvas before adding more generation modes.

The proposed product is an ongoing creative workspace for an existing brand. Its advantage must be demonstrated as customer effort saved across repeated work. “AI agent,” editable output, and brand memory are useful capabilities, but competitors already offer versions of them.

Confidence is high about the implementation gaps identified below, moderate about this direction being a sensible first experiment, and low about customer demand or competitive superiority. The founder confirmed that no users have tried Narrativee yet. No live customer sessions, product analytics, or hands-on Zeely benchmark were available. Current Narrativee observations come from the local working tree, which includes unreleased work; they do not establish what is deployed.

## What the evidence establishes

| Evidence | Finding | Implication for Narrativee | Limit |
| --- | --- | --- | --- |
| Adobe/Oxford Economics 2026 research | The overall research surveyed 3,000 executives/practitioners and 4,000 customers in October–November 2025. Its content report says 76% report production/ideation volume and speed gains from generative AI, while 53% still describe their content supply chain as linear and resource intensive. | Test whether connecting creation, correction, approval and reuse saves work that generation alone leaves behind. | Vendor-sponsored, self-reported enterprise evidence. The overall sample is not the denominator for every question. It does not establish small-business demand. [Report](https://business.adobe.com/resources/reports/content-management-digital-trends.html) |
| Adobe Express 2025 survey | Among 1,000 US business owners/professionals, 33% reported doubling content production and 36% sacrificing creativity/originality to meet output goals. | Interview prospective users about a recent recurring content task and the work they sacrificed to finish it. | Vendor-sponsored online survey, conducted 10 September 2025; broad roles and self-reporting. These are neither causal estimates nor Narrativee performance claims. [Methodology and findings](https://www.adobe.com/express/learn/blog/scale-content-with-ai) |
| Dell’Acqua et al., consulting experiment | In a randomized experiment with 758 consultants, AI users completed suitable tasks 25.1% faster. On a task outside the tested capability frontier they were 19 percentage points less likely to be correct. | Measure the whole delivery, including checking and repair. Keep human approval and easy recovery in the workflow. | Consulting tasks with GPT-4, not brand design; these percentages cannot be promised for Narrativee. [HBS paper](https://www.hbs.edu/ris/download.aspx?name=24-013.pdf) |
| Amershi et al., CHI 2019 | Human–AI interaction guidelines were evaluated with 49 design practitioners across 20 AI-infused products. They include efficient correction, granular feedback and cautious adaptation. | Put correction and memory controls beside the creative. Make learning visible and reversible. | Design guidance, not evidence of retention or willingness to pay. [Paper page](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/), [guideline explanations](https://www.microsoft.com/en-us/research/articles/guidelines-for-human-ai-interaction-eighteen-best-practices-for-human-centered-ai-design/?lang=fr_ca) |
| Doshi/Hauser 2024; Zhou/Lee/Gu 2025 | A short-story experiment found improved individual creativity alongside more similar outputs. A separate visual-art study covering 31,076 creators found wider idea exploration, largely driven by productivity gains, with reduced novelty yield per artifact. | Evaluate relevance, distinctiveness and usability separately from the number of generated options. | Different tasks and study designs; the art study is observational and covers hobbyists. Neither proves AI always homogenizes design, nor that Narrativee can prevent it. [Story paper](https://doi.org/10.1126/sciadv.adn5290), [visual-art paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC12407059/) |

These findings motivate experiments. They do not prove a market gap, a proprietary advantage, or that customers prefer a copilot.

## What Zeely and adjacent competitors already offer

Zeely’s current homepage markets an AI agent, brand intelligence, image/video generation, organic content, and campaign launch/analytics. Those are vendor claims about scope, not independently measured quality. [Homepage](https://zeely.ai/)

Its help center explicitly separates brand identity—logos, colors, fonts and tone—from product information. [Brand/product documentation](https://help.zeely.ai/en/articles/11007833-how-to-check-all-my-added-products)

Its editing documentation describes direct text changes, prompted regeneration, and variations targeting text, visual, audience, style or composition. The documentation therefore contradicts a positioning that treats Zeely as a simple, uneditable generator. [Editing documentation](https://help.zeely.ai/en/articles/11004067-how-to-edit-or-delete-an-image)

Its January 2026 workflow guide describes adding a product, creating creatives, setting goals/budget, launching to Meta, and tracking results. It also documents batches of up to 20 edit-ready templates. This supports a performance-marketing emphasis, while the homepage now shows broader capabilities. [Workflow guide](https://zeely.ai/blog/how-zeely-works/)

Canva is another material alternative: its official brand page describes AI using Brand Kits and Brand Templates, brand controls, approvals, editable imports and collaboration. A canvas plus a brand kit cannot alone be Narrativee’s differentiator. [Canva brand system](https://www.canva.com/business/features/brand/)

Zeely’s website displays Starter at $29.95/month, Plus at $49.95 and Growth at $79.95, but the FAQ on the same page says plans start at $19.99 and explains that offers differ by duration/platform. Treat pricing as offer-specific until checkout is verified; do not use it as evidence of willingness to pay for Narrativee. [Pricing](https://zeely.ai/price/)

What remains unknown: Zeely’s actual quality on the same brand briefs, correction reliability, cross-project learning, export behavior and repeated-task customer effort. Absence of documentation for a behavior is not evidence that the product lacks it.

## The useful foundation already in Narrativee

| Local implementation | What to keep | What to improve |
| --- | --- | --- |
| Website discovery and Brand Brain | Imported context, provenance, user approval, separation of rules and inspiration | Make the first useful brand preview quick. Deeper competitor research should be optional when an existing identity is sufficient. |
| Campaign document and editable Fabric canvas | Real source assets, separate text/graphics/imagery, layer metadata, persistence and PNG export | Give the agent reliable operations on the current document, including edits users made manually. |
| Creator routing | Separate generation paths for identity and campaigns | Existing-layer revisions are explicitly routed to conversation/manual controls. Add a bounded revision path. |
| Campaign evaluation | Grounded claims, plan checks, approved colors/fonts and contrast checks | Assess rendered work as well as the written plan. A good explanation does not verify that the export looks good. |
| Brand Brain feedback | Explicit saved feedback passed into future requests | Capture scoped preferences from Studio when users approve them; verify that later outputs actually apply them. |
| Projects and chat history | Reopening work and continuity | Make approved creative easy to find and reuse. A saved chat or favorite is not automatically a reusable brand decision. |

Key implementation sources:

- [Revision routing](/Users/user/Desktop/research/narrativee/apps/backend/src/studio/identity.judgment.ts): `classifyCreatorIntentWithJev` explicitly directs existing-layer revision requests to conversation and manual editing instructions.
- [Campaign context](/Users/user/Desktop/research/narrativee/apps/backend/src/studio/campaign/campaign.context.ts): generation loads messages, brand rules, fonts and image references; it does not load the current saved canvas in this path.
- [Conversation service](/Users/user/Desktop/research/narrativee/apps/backend/src/studio/studio.service.ts) and [canvas context](/Users/user/Desktop/research/narrativee/apps/backend/src/studio/canvas/canvas.context.ts): conversation already receives a structured summary of the saved canvas. Reuse that work; the agent is not wholly unaware of the canvas.
- [Campaign delivery](/Users/user/Desktop/research/narrativee/apps/backend/src/studio/campaign/campaign.service.ts): enforces one 1080×1080 frame per request and emits a new creative.
- [Canvas import](/Users/user/Desktop/research/narrativee/apps/web/app/components/studio/canvas/campaignScene.ts): new frames append while preserving existing work; this is creation rather than a targeted revision.
- [Plan judgment](/Users/user/Desktop/research/narrativee/apps/backend/src/studio/campaign/campaign.judgment.ts): explicitly judges the plan, not an unseen rendered image.
- [Memory compilation](/Users/user/Desktop/research/narrativee/apps/backend/src/brand-brain/context.ts), [Brand Brain UI](/Users/user/Desktop/research/narrativee/apps/web/app/workspace/brand-brain/page.tsx), and [roadmap](/Users/user/Desktop/research/narrativee/roadmap.md): manual feedback is supported; automatic Studio learning is listed as incomplete.
- [Studio prompt sidebar](/Users/user/Desktop/research/narrativee/apps/web/app/components/studio/StudioPromptSidebar.tsx): exposes Discovery/Creator modes and a research-oriented creative-directions request.

The local roadmap already recognizes most of these gaps. The recommendation strengthens its priorities rather than requiring a new application or a wholesale rewrite.

## Proposed customer and experience

Start with marketing generalists at growing businesses that already have a visual identity and make social/ad creative weekly. Include a small number of freelancers/agencies in discovery to test whether client review and repeated corrections are more costly there. This is a proposed acquisition focus, not a proven best segment or a change to the broader vision.

Thesis: Narrativee helps these users turn recurring briefs into approved, editable assets by making revisions precise and carrying their approved decisions into later work. The competitive claim is lower supervision across repeated briefs. It must be tested against their existing stack and Zeely.

### First session

1. Enter a website or upload a logo and an example of approved work.
2. See a compact brand preview: detected logo, colors, typography and uncertain information. Correct only what is needed for the first brief.
3. Give a concrete task: “Create a launch post for this feature; use this screenshot; audience is small agencies.”
4. Receive one usable creative and a short explanation of visible design choices. Offer another direction only when useful; do not make choosing among many options mandatory.
5. Select the headline and say, “Shorten this; keep the rest.” Narrativee applies the change, checks fit and offers undo.
6. Approve/export. When feedback could help later, offer “Remember for this brand” with a visible scope and an easy way to remove it.

Aim to make progress and brand recognition visible in the first minute. Establish a realistic generation time target after observing real runs; do not promise an entire usable asset in 60 seconds without evidence.

### Main screen

Keep the existing calm canvas and copilot direction. Organize the workspace around the job the customer came to finish:

| Area | Proposed content |
| --- | --- |
| Left navigation | Brand switcher, Projects, Approved work, Brand Brain. Put optional research inside the relevant project. |
| Project header | Brief/objective, output format, current version, saved status. |
| Center | Creative canvas with selection, direct editing, lock controls, version comparison and undo. |
| Copilot panel | Task conversation grounded in the selected frame/layer; suggested actions such as “Shorten headline,” “Try another composition,” and “Use our approved launch style.” |
| Review controls | Approve, request a revision, export. Explain unresolved problems plainly. |
| Memory detail | “Used: approved logo, approved typography, preference for restrained backgrounds.” Proposed memories can be accepted, scoped, corrected or forgotten. |

Avoid forcing customers to choose an internal Discovery/Creator mode. Let them ask for work, while exposing explicit optional research actions when helpful.

The second session is the main test of the relationship: a new brief should draw on relevant approved work and preferences without requiring the customer to repeat them. Preserve brand identity while allowing fresh campaign ideas; remembering a layout must not force every post into the same composition.

## Foundation changes, in order

### 1. Reliable revisions

Reuse current layer IDs, asset IDs and canvas revision handling. Before an agent acts, synchronize outstanding manual changes and give it the selected frame/layer and current document version. Introduce validated operations such as updating text, replacing an asset, moving a layer or recomposing a selected frame. Preserve locked/approved elements, apply changes to a version, and support undo. A stale revision should require resynchronization rather than overwrite newer work.

Do not make a simple copy edit pay for a new image generation. Reserve regeneration for requested image changes. Verify the persisted canvas and exported PNG, not just the response text.

### 2. Visible, scoped memory

Distinguish official identity, durable preferences, project-only instructions, inspiration and unconfirmed observations. Start with explicit approval of proposed memories; automatic inference can follow once usefulness is measured. Store the source project/creative and give users edit/forget controls. “Use a bright background for this sale” must not silently become a permanent brand rule.

Pass relevant memory through all creation/revision paths. Retrieve approved decisions by relevance and scope rather than relying only on the most recent messages. Keeping a record is not enough: measure whether subsequent output respects it.

### 3. Reusable approved work

Store approved creative with its brief, editable structure and intended usage. Support “use this direction for next week’s announcement,” preserving the relevant visual language while adapting the message and imagery. A memory should be able to point to the actual approved work, not just an adjective such as “minimal.”

### 4. Rendered quality and measurement

Keep deterministic checks for assets, fonts, geometry and claims. Add rendered-image inspection and human visual assessment against a small, stable set of real briefs. Track illegible text, overflow, altered logos, wrong assets, unsupported claims and unintended changes to approved parts.

Instrument first usable asset, revision success, memory applied, approval, export and return for the next real brief. Record active customer minutes, generation latency, rejected runs and full delivery cost. Current duration/image-call logging is a start; it does not capture customer effort or all retry/support cost.

### 5. Formats and collaboration after the core works

Add recomposition for the formats customers repeatedly need. Treat a change from square to portrait as a layout task rather than a stretched image. Add review links when actual approval handoffs justify them. Integrations should shorten a verified workflow; launching a broad publishing or ad-buying platform is not needed to test the initial value.

## How an advantage could compound

Near term: faster correction, more usable deliveries and fewer repeated instructions. These create value if customers notice and pay for them; they are not yet defensible.

Over time: a customer-approved body of briefs, editable creative, scoped preferences, corrections and approval outcomes can guide later work. The mechanism is useful retrieval, reliable application and reusable design structure. Data volume alone provides no advantage, and competitors can build similar features.

At a broader scale, customer-permitted learning and strong evaluations may improve delivery quality across an identified segment. Private customer material should not be pooled by default. Maintain exportability; retention should come from useful accumulated work rather than trapping it.

Connect performance data later if users need it. An approved design and a converting ad are separate outcomes. CTR/CPA differences can also reflect offer, audience, placement, budget and attribution. Do not turn a single winning ad into a universal brand rule or promise conversion uplift without controlled testing.

The strongest objection is that customers may already solve this cheaply with Canva templates or a general AI assistant. If Narrativee requires comparable briefing and cleanup, the accumulated-memory story does not justify switching. This is what the pilot must try to disprove.

## A pilot before a large roadmap

Recruit eight participants with existing brands and genuine upcoming content work, provisionally four small marketing teams and four freelancers/agencies. Ask each to show one recent brief, the original tool files, corrections and delivered output before demonstrating Narrativee.

Run three real briefs per participant over roughly two weeks, extending the window if the next genuine need occurs later. Use the customer's existing workflow as the main baseline. Run a matched Zeely comparison where access and comparable outputs are available; record plan/tool/version, setup time and operator skill. Have the customer judge anonymous outputs where practical, counterbalance tool order, and include setup/revision time. Reusing the same brief twice introduces learning effects, so rotate matched briefs and document remaining bias.

Test memory on later briefs both with and without the saved preferences on a representative subset. This checks whether memory causes an improvement, rather than attributing practice or a better brief to the memory system.

| Measure | Proposed decision rule, not a market benchmark |
| --- | --- |
| Usability | At least six of eight participants actually use two of their three assets without rebuilding the design elsewhere. Log any outside repair. |
| Customer effort | Median active customer time is at least 30% lower than their baseline, including briefing, review, revision and cleanup. Preserve quality. |
| Revision reliability | At least 90% of a predefined set of simple revision requests change the intended elements and preserve unrelated/locked work. Report failures individually. |
| Continuity | Later briefs require fewer repeated instructions; a memory-on/off comparison shows a useful improvement for the relevant preferences. |
| Return | At least five of eight use Narrativee for their next genuine brief without the founder prompting them to do so. |
| Payment | At least three make an actual paid continuation commitment at a clearly stated offer, rather than only saying they would pay. |
| Economics | Full delivery cost, including rejected runs and support time, fits the offered price with an acceptable margin; set that margin explicitly before broad free usage. |

With eight participants, these are operating gates for deciding what to test next, not statistical proof of market-wide superiority. Keep per-user results, task difficulty and segment differences visible.

If first outputs are unusable, fix composition before adding automation. If outputs are useful but revisions are costly, prioritize editing reliability. If memory does not help later tasks, test approved-work reuse before expanding automatic learning. If users like the results but do not return or pay, revisit frequency, segment and alternative costs. Expand formats or review workflows only when they explain a demonstrated adoption blocker.

## Decision for the next release

The next coherent release should deliver: a fast brand preview, one strong editable creative, precise conversational revision, explicit approval/export, and one saved decision that helps the next brief. Recruit and observe users while closing those gaps. Defer broad identity/rebrand work, avatar/video expansion, more model choices and automated media buying until the recurring creative job earns adoption.

Research supports this as an experiment worth running. Competitive leadership will require evidence that Narrativee delivers better work with less customer effort on the tasks its chosen users repeatedly need.
