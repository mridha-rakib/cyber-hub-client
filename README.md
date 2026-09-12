# Cyber Hub — Client

Production-ready [Next.js 16](https://nextjs.org) application (App Router, TypeScript, Tailwind CSS v4).

## Tech Stack

| Concern          | Choice                                             |
| ---------------- | -------------------------------------------------- |
| Framework        | Next.js 16 (App Router, `src/` dir, Turbopack)     |
| Language         | TypeScript (strict)                                |
| Styling          | Tailwind CSS v4                                    |
| UI components    | [shadcn/ui](https://ui.shadcn.com) (Radix, `new-york`) |
| Theming          | [next-themes](https://github.com/pacocoursey/next-themes) — light / dark / system |
| Icons            | [lucide-react](https://lucide.dev)                 |
| Lint / Format    | [Biome](https://biomejs.dev) (replaces ESLint)     |
| Git hooks        | Husky + lint-staged (pre-commit Biome check)       |
| State management | [Zustand](https://zustand-demo.pmnd.rs)            |
| Data fetching    | [TanStack Query](https://tanstack.com/query)       |
| HTTP client      | [Axios](https://axios-http.com) (shared instance)  |
| Forms            | React Hook Form + Zod (`@hookform/resolvers`)      |

## Installation

Requires Node.js `>=20`.

```bash
# 1. Install dependencies (also sets up Husky via the `prepare` script)
npm install

# 2. Create your local environment file
cp .env.example .env.local

# 3. Start the dev server (http://localhost:3000)
npm run dev
```

## Environment Setup

Environment variables are validated at runtime by [`src/config/env.ts`](src/config/env.ts) using Zod.
Add new variables to that schema so they are type-checked and fail fast when missing/invalid.

| Variable              | Required | Default                     | Description                        |
| --------------------- | -------- | --------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL` | no       | `http://localhost:8000/api` | Base URL used by the Axios client. |

Only `NEXT_PUBLIC_*` variables are exposed to the browser. Copy `.env.example` to `.env.local`
(git-ignored) and override as needed.

## Available Commands

| Command            | Description                                                        |
| ------------------ | ---------------------------------------------------------------- |
| `npm run dev`      | Start the development server (Turbopack).                       |
| `npm run build`    | Create an optimized production build.                           |
| `npm run start`    | Serve the production build (run `build` first).                 |
| `npm run check`    | Run Biome lint + format check + import sorting (no writes).     |
| `npm run check:fix`| Same as `check` but applies safe fixes.                         |
| `npm run format`   | Format all files with Biome.                                    |
| `npm run lint`     | Run only the Biome linter.                                      |
| `npm run typecheck`| Run `tsc --noEmit`.                                             |

A `pre-commit` hook runs `lint-staged`, which applies `biome check --write` to staged files.

## Folder Structure

```
src/
├── app/                  # Next.js App Router (routes, layouts)
│   ├── layout.tsx        # Root layout, wraps children in <Providers>
│   ├── page.tsx          # Home route
│   └── providers.tsx     # Client provider tree (TanStack Query, ...)
│
├── components/
│   ├── ui/               # shadcn/ui primitives (button, dropdown-menu, ...)
│   ├── common/           # Composed, app-aware shared components
│   ├── theme-provider.tsx  # next-themes wrapper
│   └── theme-toggle.tsx    # Light / Dark / System switcher
│
├── features/             # Vertical feature slices (see features/README.md)
│
├── hooks/                # Reusable hooks (useZodForm, query hooks, ...)
│
├── lib/
│   └── utils.ts          # `cn()` — clsx + tailwind-merge (shadcn convention)
│
├── stores/               # Zustand stores, one <domain>.store.ts per domain
│
├── services/
│   ├── api.ts            # Shared Axios instance + interceptors
│   └── *.service.ts      # Per-resource API modules
│
├── schemas/              # Zod schemas (<domain>.schema.ts) + shared fields
│
├── types/                # Shared TypeScript types
│
├── utils/                # Framework-agnostic helpers (re-exports cn, sleep, ...)
│
├── constants/            # App-wide constant values
│
└── config/               # Runtime config (validated env, QueryClient factory)
```

### Conventions

- **API calls** go through `src/services/api.ts`; each resource gets a
  `*.service.ts` module. Components never call `axios` directly.
- **Server state** lives in TanStack Query hooks (`src/hooks`), with a
  query-key factory per resource. **Client/UI state** lives in Zustand stores.
- **Forms** define a Zod schema in `src/schemas`, then use
  `useZodForm(schema)` ([`src/hooks/use-zod-form.ts`](src/hooks/use-zod-form.ts))
  which wires up `zodResolver`. See
  [`src/features/auth/components/login-form.tsx`](src/features/auth/components/login-form.tsx).
- **Path alias**: `@/*` maps to `src/*`.

## UI System & Theming

- **shadcn/ui** is configured in [`components.json`](components.json) (`new-york`
  style, Radix primitives, CSS variables, `lucide` icons). Add components with:

  ```bash
  npx shadcn@latest add <component>
  ```

  They land in `src/components/ui`. `cn()` lives in
  [`src/lib/utils.ts`](src/lib/utils.ts) and is also re-exported from `@/utils`.

- **Theme** is provided by `next-themes` via
  [`src/components/theme-provider.tsx`](src/components/theme-provider.tsx)
  (wrapped in [`src/app/providers.tsx`](src/app/providers.tsx)). It toggles the
  `.dark` class on `<html>`; `<html>` has `suppressHydrationWarning`.
  [`ThemeToggle`](src/components/theme-toggle.tsx) offers Light / Dark / System.

### Design tokens

All colors are **semantic CSS variables** defined once in
[`src/app/globals.css`](src/app/globals.css) for `:root` (light) and `.dark`,
then exposed to Tailwind through `@theme inline`. Use the token utilities —
never hardcoded colors:

| Token         | Utility examples                              |
| ------------- | -------------------------------------------- |
| `background`  | `bg-background`                              |
| `foreground`  | `text-foreground`                            |
| `primary`     | `bg-primary` / `text-primary-foreground`     |
| `secondary`   | `bg-secondary` / `text-secondary-foreground` |
| `muted`       | `bg-muted` / `text-muted-foreground`         |
| `accent`      | `bg-accent` / `text-accent-foreground`       |
| `border`      | `border-border`                             |

Additional tokens (`card`, `popover`, `destructive`, `input`, `ring`, `chart-*`,
`sidebar-*`) follow the same pattern. To re-theme, edit the variable values in
`globals.css` — components pick them up automatically in both light and dark.

## Code Quality

Biome is configured in [`biome.json`](biome.json): formatter + linter with the
`recommended` preset, import sorting via `assist.actions.source.organizeImports`,
2-space indent, 100 char line width, double quotes, trailing commas. There is no
ESLint config in this project.
