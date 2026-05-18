# AGENTS.md — SYNQ

## Project

React 18 SPA — freelance marketplace UI. **JavaScript only (no TypeScript)**, despite `@types/react` in devDependencies.

## Commands

```
npm install
npm run dev      # Vite dev server on port 3000 (host 0.0.0.0)
npm run build    # production build → dist/
npm run preview  # preview production build
```

No lint/typecheck/test scripts exist. Do not invent them.

## Architecture

- Entry: `src/main.jsx` → `<BrowserRouter>` → `src/App.jsx`
- State: single `AppContext` in `src/store/index.jsx` (Context + useReducer). Access via `useAppContext()` hook, never direct `useContext`.
- All data is mock — lives in `src/data/`. No backend API calls from the frontend.
- `JobModal` renders globally in `App.jsx` (outside routes).
- `ProtectedRoute` wraps all routes except `/` and `/auth`. It checks `state.isAuthenticated` and redirects to `/auth`.
- Page transitions use `<AnimatePresence mode="wait">` from Framer Motion.

## Routes

| Route | Page | Protected |
|-------|------|-----------|
| `/` | HomePage | No |
| `/auth` | AuthPage | No |
| `/categories` | CategoriesPage | Yes |
| `/jobs` | JobsPage | Yes |
| `/job/:id/proposals` | JobProposalsPage | Yes |
| `/profile/:id` | ProfilePage | Yes |
| `/chat` | ChatPage | Yes |
| `/create-job` | CreateJobPage | Yes |

## Directory layout

| Path | Purpose |
|------|---------|
| `src/components/common/` | Reusable UI: Button, Input, Card, Badge, Avatar, Modal, ProtectedRoute |
| `src/components/layout/` | Header, Footer |
| `src/components/features/` | Domain: JobCard, JobModal, PostCard, ChatMessage, ProposalCard |
| `src/pages/` | 8 page components (one per route) |
| `src/store/` | Single `index.jsx` — all app state + actions |
| `src/hooks/` | Custom hooks (`index.js`) |
| `src/utils/` | Helper functions (`helpers.js`) |
| `src/data/` | Mock data files: jobs, users, categories, messages, proposals, posts, reviews |
| `src/index.css` | Global styles + Tailwind directives + utility classes (`.glass`, `.card-float`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.masonry`, etc.) |

## Docker

`docker-compose.yml` defines the full stack: PostgreSQL (port 5438), .NET backend (port 5000), Mailpit (port 8025), and this frontend (port 3000). The backend code lives in `backend/` (Clean Architecture: Synq.WebApi, Synq.Application, Synq.Domain, Synq.Infrastructure).

## Style conventions

- TailwindCSS v3 with custom tokens in `tailwind.config.js`: `primary`, `gray`, `success`, `warning`, `error` color scales; custom `float` and `pulse-slow` animations; custom `backdropBlur-xs`
- Font stack: Inter → system-ui → sans-serif
- Glassmorphism: use `.glass` / `.glass-dark` CSS classes (defined in `index.css`), not inline Tailwind
- Floating cards: use `.card-float` class
- Buttons: use `.btn-primary`, `.btn-secondary`, `.btn-ghost` classes
- Masonry layout: use `.masonry` / `.masonry-item` classes (CSS columns, responsive 1/2/3 cols)
- Framer Motion for hover and page transitions
- clsx for conditional class composition
- Components use **default exports**
- Hooks and utils use `.js` extension (not `.jsx`)

## Gotchas

- Do not add TypeScript — the codebase is intentionally JS-only
- No backend exists in the frontend; all data is mock. Do not add API calls unless asked
- No testing infrastructure. If asked to test, clarify approach first
- The `ProtectedRoute` component redirects unauthenticated users to `/auth`, not `/login`
- `.opencode/` directory contains OpenCode agent configs (C# backend agents) — do not modify unless specifically asked