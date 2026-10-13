# Brand board experiment

This is a CLI-only experiment. It reads a **completed** `site_analysis`; both the brand diagnosis and competitor comparison must be present. Studio creates editable identity objects directly on its Fabric canvas instead; the board comes later.

From the repository root:

```sh
pnpm --filter backend board:generate
```

The default target is `https://www.trylark.ai/`. Pass `--url` for another researched website or `--out` for another output directory. Each run creates a new folder under `apps/backend/output/brand-board/` containing `board.png`, `artwork.png`, `direction.json`, and `critique.md`. The output directory is git-ignored.

Prerequisites: the Postgres configured by `apps/backend/.env` must be available, its Lark discovery and competitor analysis must be complete, and `OPENAI_API_KEY` must be set. `BRAND_BOARD_TEXT_MODEL` and `BRAND_BOARD_IMAGE_MODEL` can override the default models. One run generates up to two artwork candidates and selects one; it does not generate multiple directions.

For the quality gate, run three experiments and compare each board with a plain image-generation attempt using the same research summary. Judge brand fit, distinctiveness, legibility, and whether it is presentable without manual redesign. Check the direction JSON for cited research IDs and the critique for reviewer concerns; neither substitutes for human approval of factual claims.
