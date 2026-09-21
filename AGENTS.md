# Repository Guidelines

## Project Structure & Module Organization

TapCard uses React 19, TypeScript, Vite, OxLint, React Router and Supabase. Netlify Functions handle public tracking and redirects. See README.md and docs/SETUP.md for current architecture and deployment.

- `src/main.tsx` mounts the application with React Strict Mode.
- `src/App.tsx` defines public/admin routes; `src/App.css` preserves the public design.
- `src/admin/` implements private administration. Client guards are UX only: PostgreSQL RLS and RPC grants enforce authorization.
- `src/lib/businessAdapter.ts` maps SQL rows to the existing public Business model.
- `supabase/migrations/` contains versioned schema, RLS, Storage policies and RPCs. Never silently modify a migration already applied remotely.
- `netlify/functions/` contains HTTP entrypoints only; shared server modules belong in `netlify/lib/`.
- `src/index.css` defines global styles, theme variables, and responsive defaults.
- `src/assets/` holds imported images and SVGs. `public/` holds assets referenced directly by URL, such as `/icons.svg`.
- `index.html` is the HTML entry point. Root-level `vite.config.ts`, `tsconfig*.json`, and `.oxlintrc.json` configure tooling.
- `dist/`, `.netlify/`, `artifacts/` and real `.env*` files are generated/private and ignored by Git. `.env.example` is safe to track.

## Build, Test, and Development Commands

Run commands from the repository root:

- `npm ci`: install dependencies from the committed lockfile.
- `npm run dev -- --offline`: start Netlify Dev + Vite + Functions at localhost:8888 without linking a remote Netlify site. Do not use the Vite port for end-to-end tracking tests.
- `npm run build`: run frontend/server/test TypeScript checks, then produce the production bundle in `dist/`.
- `npm run lint`: run Oxlint with the repository configuration.
- `npm run preview`: serve the production build locally; run the build first.
- `npm test`: Node/tsx tests, including real local PostgreSQL via PGlite, endpoint contracts and QR decoding.
- `npm run test:ui`: Chrome headless UI checks at desktop/mobile widths with synthetic Supabase responses. Requires installed Chrome; does not verify remote integration.

## Coding Style & Naming Conventions

Match existing code: two-space indentation, single-quoted TypeScript strings, no TypeScript semicolons, and double-quoted JSX attributes. Use PascalCase for React components and component filenames, camelCase for functions and variables, and kebab-case for CSS classes. Use `.tsx` for JSX and `.ts` for other TypeScript modules.

Prefer function components and hooks. Respect Oxlint's hook rules and component-export checks. TypeScript checks unused locals, unused parameters, and switch fallthrough. No dedicated formatter is configured; preserve surrounding formatting.

## Testing Guidelines

Use tests/*.test.ts for Node tests and tests/ui-check.ts for browser contracts. Run lint, build and relevant tests after changes. For visual changes check narrow/wide layouts and light/dark public themes. Keep remote Supabase/Netlify checks explicitly separate from local fixtures and PGlite scaffolding. Never claim a QR was camera-scanned when only software decoding ran.

## Security invariants

- Never expose service_role/secret keys through VITE_* or commit secrets. Never execute remote migrations, pushes or deployments without an explicit request.
- Admin membership is a protected database UUID allowlist. No email checks, editable user metadata, public signup, or self-enrollment.
- Preserve RLS on every application table and Storage; restrict RPC execution. SECURITY DEFINER must use an empty search_path and fully qualified objects.
- Public reads require published businesses and enabled actions. Demo mocks are explicit only.
- Keep slug locking in the database after first publication and save business/actions atomically.
- Redirects resolve destinations from identifiers in the database. No arbitrary client URL. Analytics failures must not block a resolved valid redirect; log failures without secrets or visitor identifiers.
- Tracking uses UUID uniqueness and a database rate window, never only a process-local counter. Explain statistical and anti-abuse limits.
- Public Storage includes draft assets. Use unique file names; preserve the prior saved image on upload failure.

## Commit & Pull Request Guidelines

The only existing commit uses a `chore:` prefix. Follow that style with concise, imperative subjects such as `feat: add card editor` or `fix: correct counter alignment`.

Keep pull requests focused. Describe the change, link relevant issues, and report validation performed. Include screenshots for UI changes. Commit `package-lock.json` with dependency changes; exclude generated output and local configuration.

## Learning Workflow

This is a learn-by-doing project. The developer is learning React, TypeScript, CSS, and frontend architecture.

Before implementing a feature:
- explain the React, TypeScript, or CSS concepts involved;
- propose a small implementation plan;
- keep the task limited to one focused feature;
- allow the developer to attempt the implementation first when appropriate.

Do not generate entire pages or large features unless explicitly requested. The complete Supabase/admin/QR/statistics/Netlify implementation was explicitly authorized; do not wait for the user to write code for that scope. Keep code understandable and briefly explain important choices.
Prefer hints and targeted examples when the developer is solving an exercise.
Review existing code before replacing it.
Explain errors and their cause before fixing them.
Do not introduce dependencies without explaining their purpose and tradeoffs.
Use plain CSS initially to practice responsive design, Flexbox, and Grid.
Never commit secrets, `.env`, or `.env.local` files.
