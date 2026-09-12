# Features

Each feature is a self-contained vertical slice. Suggested layout:

```
features/
└── auth/
    ├── components/     # UI specific to this feature
    ├── hooks/          # feature-scoped hooks (wrap TanStack Query)
    ├── api.ts          # calls the shared services/api instance
    ├── schema.ts       # Zod schemas for this feature's forms
    ├── store.ts        # optional Zustand slice
    └── types.ts
```

Rules of thumb:

- Cross-feature primitives belong in `src/components/ui`.
- Shared, app-aware components belong in `src/components/common`.
- Only re-export a feature's public surface from an `index.ts`.
