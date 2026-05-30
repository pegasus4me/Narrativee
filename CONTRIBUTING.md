# Contributing

Thanks for your interest in contributing to Narrativee.

## Development setup

1. Install dependencies:
   - `pnpm install`
2. Configure backend env:
   - `cp apps/backend/.env.example apps/backend/.env`
3. Configure frontend env:
   - `cp apps/web/.env.example apps/web/.env.local`
4. Start the app:
   - `pnpm dev`

## Before opening a PR

- Run type checks: `pnpm check-types`
- Ensure no secrets are committed
- Keep changes focused and documented

## Pull request guidelines

- Use clear PR titles and descriptions
- Include screenshots for UI changes
- Reference related issues when available

## Commit style

- Prefer small, atomic commits
- Use imperative messages (e.g. `Add memory source validation`)
