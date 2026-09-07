# Repository Guidelines

## Project Structure & Module Organization

Tapcard currently contains a minimal React 19 application using TypeScript and Vite.

- `src/main.tsx` mounts the application with React Strict Mode.
- `src/App.tsx` contains the starter UI; `src/App.css` provides its styles.
- `src/index.css` defines global styles, theme variables, and responsive defaults.
- `src/assets/` holds imported images and SVGs. `public/` holds assets referenced directly by URL, such as `/icons.svg`.
- `index.html` is the HTML entry point. Root-level `vite.config.ts`, `tsconfig*.json`, and `.oxlintrc.json` configure tooling.
- `dist/` is generated build output and is ignored by Git. No test directory currently exists.

## Build, Test, and Development Commands

Run commands from the repository root:

- `npm ci`: install dependencies from the committed lockfile.
- `npm run dev`: start Vite with hot module replacement.
- `npm run build`: run TypeScript project checks, then produce the production bundle in `dist/`.
- `npm run lint`: run Oxlint with the repository configuration.
- `npm run preview`: serve the production build locally; run the build first.

## Coding Style & Naming Conventions

Match existing code: two-space indentation, single-quoted TypeScript strings, no TypeScript semicolons, and double-quoted JSX attributes. Use PascalCase for React components and component filenames, camelCase for functions and variables, and kebab-case for CSS classes. Use `.tsx` for JSX and `.ts` for other TypeScript modules.

Prefer function components and hooks. Respect Oxlint's hook rules and component-export checks. TypeScript checks unused locals, unused parameters, and switch fallthrough. No dedicated formatter is configured; preserve surrounding formatting.

## Testing Guidelines

No automated test framework, test script, coverage threshold, or test naming convention is configured. For code changes, run `npm run lint` and `npm run build`, then verify affected interactions in the browser. For visual changes, check narrow and wide layouts and light/dark themes. If adding automated tests, document the runner, naming convention, and command alongside the setup.

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

Do not generate entire pages or large features unless explicitly requested.
Prefer hints and targeted examples when the developer is solving an exercise.
Review existing code before replacing it.
Explain errors and their cause before fixing them.
Do not introduce dependencies without explaining their purpose and tradeoffs.
Use plain CSS initially to practice responsive design, Flexbox, and Grid.
Never commit secrets, `.env`, or `.env.local` files.