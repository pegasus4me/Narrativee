# Narrativee roadmap

This is a living roadmap, not a release promise. It follows the [README vision](README.md): an AI designer that learns a company's brand and works alongside its team to create beautiful, brand-consistent campaigns and assets.

The first customers are growing startups and small marketing teams with an existing brand and recurring social or ad creative needs. Agencies doing this work for client brands also fit the wider direction.

## First release focus

Deliver one editable square static social or ad creative from an existing brand and a short brief. Make the composition useful, respect approved identity, support reliable revisions, and carry explicitly saved decisions into the next request.

Prioritize the complete brief → creation → revision → export loop before expanding formats, integrations, automatic learning, or agency operations. Product announcements are one possible brief within this job, not a separate product category.

The release earns its place when customers use or publish the work without rebuilding it, then return with another brief. The advantage over their existing workflow must show up as less customer effort and fewer corrections.

## Core loop

Existing brand and source material → approved Brand Brain context → brief in Studio → one editable creative → revision and export → explicitly saved decisions for the next request.

The agent does the creative heavy lifting. The human can steer, edit, approve, and correct what the agent remembers.

## Current foundation

- Discovery and competitor research remain separate research workflows; detected website identity and evidence-backed brand understanding now populate Brand Kit.
- Brand Brain stores brand rules, inspiration, feedback, and uploaded images.
- Studio replies and logo generation receive Brand Brain context before generation.
- Campaign generation receives actual visual references as well as their captions; older conversation/logo paths still have separate context handling.
- Website-to-kit population is connected. Automatic learning from Studio is not connected yet.

## Next: make Brand Brain useful without manual setup

- [x] Automatically populate Brand Kit from website discovery: detected logo, social-sharing image, named colors, font families, and evidence-backed brand observations, where available. Existing saved scans are also supported.
- [x] Show the source of imported information and distinguish website observations from user-approved identity. Do not invent missing information.
- [x] Let users add material, confirm imported rules or assets, and archive/replace incorrect findings. Their explicit choices take priority.
- [x] Make repeated discovery safe: avoid duplicate imports, respect archived findings, and never silently overwrite user corrections or approvals.
- [x] Pass uploaded logos and visual references to the campaign design engine as images, not only captions.
- [ ] Keep brand context available across Studio projects and creation paths; verify that the designer actually respects it.

Success signal: a user enters their website, sees a useful starting kit, corrects anything necessary, and gets work that follows that identity without re-entering it in every prompt.

## Next: review onboarding for the fastest possible wow moment

- [ ] Review the full onboarding journey from landing page and signup to the first usable creation in Studio.
- [ ] Maximize the wow moment as early as possible: let users see that the designer understands their brand and can produce something worth using.
- [ ] Remove unnecessary forms, configuration, and lengthy discovery exchanges before the first result.
- [ ] Explore a fast path: website → visible brand understanding → one short campaign brief → first asset. Keep deeper research and optional inputs from blocking this path unnecessarily.
- [ ] Make progress and failures understandable, preserve user input, and provide recovery when website extraction is incomplete.
- [ ] Measure time to first usable asset, onboarding completion, and where users leave. Set a realistic speed target after observing real runs, without lowering the quality bar.

Success signal: new users reach a recognizable, presentable first asset quickly and understand why Narrativee is more useful than a generic image-generation prompt.

## Next: strengthen the design engine

- [x] Implement one square static campaign creative per request, with a multi-frame document contract for future formats.
- [x] Generate separate editable text, graphics, and image layers directly in Studio, without replacing existing work.
- [x] Add authenticated server saving, private project imagery, revision conflicts, reopening, and selected-frame PNG export.
- [ ] Review three real campaign briefs and require at least two usable, on-brand compositions without rebuilding them. Automated written-plan judgment is not a visual quality gate.
- [ ] Improve art direction, composition, typography, imagery, and brand consistency together—not just prompt complexity.
- [ ] Evaluate creations against approved identity, the brief, visual quality, and reference interpretation. References guide exploration; they are not instructions to copy another brand.
- [ ] Make revisions preserve approved parts of the creative while changing the requested text, imagery, or composition. Verify the saved and exported result, not only the assistant's reply.
- [ ] Save explicitly approved work for reuse in Brand Brain; canvas saving must not silently promote it into brand rules.
- [ ] Test the same workflow twice with early customers: does the second delivery need less explanation and fewer corrections?

Success signal: customers use or publish the assets without manual redesign, then return for another brief.

## Then: automatic learning through collaboration

- [ ] Capture explicit approvals, corrections, and useful feedback from Studio, with the project and source that produced them.
- [ ] Separate campaign-specific instructions from lasting brand preferences; one request should not become a permanent rule by default.
- [ ] Learn recurring preferences automatically, while keeping uncertain inferences distinct from approved identity.
- [ ] Never silently replace official logos, palettes, fonts, or directives. Propose identity changes for human approval.
- [ ] Let users inspect, correct, and forget learned preferences. Evolve the manual Feedback tab into a view of what the designer has learned.
- [ ] Verify that saved lessons improve later work and do not conflict with explicit brand rules.

Success signal: the designer remembers useful corrections across projects, while users retain control of their identity and memory.

## Future integrations and capabilities

Backlog only. Add an integration when repeated customer needs justify it and it improves the core loop. Validate API access, costs, privacy, and asset reuse rights before implementation.

- [ ] Pinterest: selectively import references from a customer's boards, with notes explaining what they like about each reference.
- [ ] Image libraries such as Pexels or Unsplash: find suitable photography with verified usage terms and source tracking.
- [ ] Custom fonts: import licensed fonts alongside the existing Google Fonts selection.
- [ ] Additional social and ad placements: add a channel/placement picker and verified size presets, then recompose approved creative for each format after square creative delivery is reliable.
- [ ] Email, WhatsApp, or SMS: notify customers when requested work is ready for review.
- [ ] Instagram, Meta, X, and other publishing channels: approved publishing workflows after asset quality and review are reliable.
- [ ] Reusable visual-system library: original parameterized designs and presets; do not embed third-party tool code or assets without verified rights.
- [ ] Brand boards: assemble selected and approved Studio work into a presentation after creation, rather than making a report the primary output.

## Roadmap discipline

- Keep the first release centered on excellent static social and ad creative for existing brands, reliable revisions, and explicit continuity between requests.
- Keep the long-term AI brand designer vision separate from the first release's promises. Broader identity work, motion and video, and agency operations do not block this entry point.
- Do not turn Studio into a Figma replacement before the agent's core workflow is useful.
- Ship small improvements, test with customers, and prioritize quality and distribution over speculative features.
- Keep future integrations here until they earn a place in active work. Revisit priorities after each customer test; dates remain unset until scope and evidence support them.
