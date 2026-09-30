# Brand board experiment

The same generator runs from the CLI and Studio. It reads a **completed** `site_analysis`; both the brand diagnosis and competitor comparison must be present. The Studio preview does not add a database table or editable Fabric layers.

From the repository root:

```sh
pnpm --filter backend board:generate
```

The default target is `https://www.trylark.ai/`. Pass `--url` for another researched website or `--out` for another output directory. Each run creates a new folder under `apps/backend/output/brand-board/` containing `board.png`, `artwork.png`, `direction.json`, and `critique.md`. The output directory is git-ignored.

Prerequisites: the Postgres configured by `apps/backend/.env` must be available, its Lark discovery and competitor analysis must be complete, and `OPENAI_API_KEY` must be set. `BRAND_BOARD_TEXT_MODEL` and `BRAND_BOARD_IMAGE_MODEL` can override the default models. One run generates up to two artwork candidates and selects one; it does not generate multiple directions.

In Studio, open a brand project and choose **Brand board** in the central workspace. **Generate board** starts a background run tied to that project's brand ID. The page shows progress, the latest PNG, an automated critique, and downloads for `board.png`, `direction.json`, and `critique.json`. Runs are retained in git-ignored `apps/backend/output/studio-boards/<projectId>/`; `latest.json` points to the current result. Files are served only through authenticated, project-owned API routes. This local-file experiment is not durable cloud storage.

For the quality gate, run three experiments and compare each board with a plain image-generation attempt using the same research summary. Judge brand fit, distinctiveness, legibility, and whether it is presentable without manual redesign. Studio is currently an iteration surface, not proof that the quality gate passed. Check the direction JSON for cited research IDs and the critique for reviewer concerns; neither substitutes for human approval of factual claims.
