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
- API layer: `src/api/` — axios client (`client.js`) with `withCredentials: true` (cookie auth). Domain modules: auth, jobs, categories, users, proposals, posts, reviews, chats, signalR. All endpoints go through `/api` prefix.
- Real-time: `src/api/signalr.js` — SignalR WebSocket connection to `/chatHub` for live chat.
- Normalizers: `src/utils/normalize.js` transforms raw API responses into the shape frontend components expect (`normalizeJob`, `normalizeUser`, `normalizeCategory`, `normalizeProposal`).
- `src/data/` still exists with mock data — some pages may still reference it as fallback during development.
- `JobModal` renders globally in `App.jsx` (outside routes).
- `ProtectedRoute` wraps all routes except `/` and `/auth`. It checks `state.isAuthenticated` and redirects to `/auth`.
- Page transitions use `<AnimatePresence mode="wait">` from Framer Motion.
- Auth flow: `AppProvider` calls `authApi.me()` on mount (cookie check). Login saves user to localStorage; logout clears it.

## Vite dev proxy

`vite.config.js` proxies these paths to the backend at `http://backend:5000`:
- `/api` → REST API
- `/uploads` → static file uploads
- `/chatHub` → SignalR WebSocket (`ws: true`)

This only takes effect when running via Docker Compose. For local dev without Docker, the backend URL must be changed or a manual proxy added.

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
| `/my-proposals` | MyProposalsPage | Yes |
| `/my-jobs` | MyJobsPage | Yes |

## Directory layout

| Path | Purpose |
|------|---------|
| `src/api/` | Axios client + per-domain API modules + SignalR service |
| `src/components/common/` | Reusable UI: Button, Input, Card, Badge, Avatar, Modal, ProtectedRoute |
| `src/components/layout/` | Header, Footer |
| `src/components/features/` | Domain: JobCard, JobModal, PostCard, ChatMessage, ProposalCard |
| `src/pages/` | 10 page components (one per route) |
| `src/store/` | Single `index.jsx` — all app state + actions |
| `src/hooks/` | Custom hooks (`index.js`) |
| `src/utils/` | `helpers.js` (date/currency formatting, Russian locale), `normalize.js` (API response normalizers), `slug.js` (Cyrillic→Latin slugify) |
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
- Localization is Russian: `helpers.js` formats dates/currency with `date-fns/locale/ru` and `Intl.NumberFormat('ru-RU')`

## Gotchas

- Do not add TypeScript — the codebase is intentionally JS-only.
- The frontend calls real API endpoints via `src/api/`. The backend must be running for full functionality. Mock data in `src/data/` is still used as fallback in some places.
- API responses must go through normalizers in `src/utils/normalize.js` before rendering — don't use raw API shapes directly in components.
- No testing infrastructure. If asked to test, clarify approach first.
- The `ProtectedRoute` component redirects unauthenticated users to `/auth`, not `/login`.
- `.opencode/` directory contains OpenCode agent configs (C# backend agents) — do not modify unless specifically asked.
- **Auth flash on refresh:** `initialState.isAuthenticated` is `false`. Even though `currentUser` is rehydrated from `localStorage`, `ProtectedRoute` will redirect to `/auth` on every hard refresh until `authApi.me()` resolves. Any fix to this must also update `ProtectedRoute` logic.
- **`normalizeUser` divergence:** `src/store/index.jsx` defines its own `normalizeUser` with default role `'client'`. `src/utils/normalize.js` defaults role to `'freelancer'`. Do not swap them blindly or default role behavior changes.
- **SignalR token mismatch:** `src/api/signalr.js` expects `localStorage.getItem('accessToken')`, but the auth flow only stores `user` in localStorage and relies on cookies. SignalR will not connect as-is.
