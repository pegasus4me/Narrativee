# Claude Code Guidelines

## Code Quality

- Follow clean code principles: clear naming, single responsibility, no magic numbers
- Keep functions small and focused — one function, one purpose
- Prefer explicit over clever; code should read like prose
- Avoid deep nesting; use early returns to reduce complexity

## File & Project Structure

- Never put all logic in a single file — separate concerns across files
- Group files by feature or domain, not by type alone
- Name files after what they do: `useAuth.ts`, `formatDate.ts`, `UserCard.tsx`
- Delete dead code instead of commenting it out
- Barrel exports (`index.ts`) per feature folder to keep imports clean

## Composables & Reusability

- Extract repeated logic into composables or utility functions
- Composables handle behavior; components handle presentation
- Keep composables pure and independently testable where possible
- Co-locate a composable with the feature it belongs to unless it's truly shared

## Components

- One component per file
- Keep components small — if it needs scrolling to read, consider splitting it
- Separate data-fetching logic from rendering logic
- Use props and emits explicitly; avoid implicit coupling

## TypeScript

- Always use strict mode (`"strict": true` in `tsconfig.json`)
- Never use `any` — use `unknown` and narrow, or model the type properly
- Define types and interfaces in a co-located `.types.ts` file or at the top of the module
- Prefer `interface` for object shapes, `type` for unions, intersections, and aliases
- Use `satisfies` to validate literals without widening the type
- Avoid type assertions (`as Foo`) unless absolutely necessary — prefer type guards
- Use generics to keep utilities reusable and type-safe
- Return types on exported functions should always be explicit
- Use `readonly` for data that should not be mutated
- Prefer discriminated unions over optional fields for variant shapes

## Naming Conventions

- **Variables/functions:** `camelCase`
- **Types/interfaces/classes/components:** `PascalCase`
- **Files:** `kebab-case` for utilities and composables, `PascalCase` for components
- **Constants:** `UPPER_SNAKE_CASE`
- **Type parameters:** single uppercase letter or descriptive `PascalCase` (`T`, `TItem`, `TResponse`)
- Booleans should read as questions: `isLoading`, `hasError`, `canEdit`

## Comments & Documentation

- Comment *why*, not *what* — the code shows what, comments explain intent
- Add JSDoc to all exported functions, types, and composables
- Avoid stale comments; update or remove them when code changes