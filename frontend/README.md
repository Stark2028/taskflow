# TaskFlow — frontend

React + TypeScript single-page app for TaskFlow, built with Vite, Tailwind CSS v4,
React Router (declarative mode) and axios.

## Getting started

```bash
cp .env.example .env      # points the app at the API (default http://localhost:8000)
npm install
npm run dev               # http://localhost:5173
```

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot reload     |
| `npm run build`   | Type-check (`tsc -b`) and build into `dist/`  |
| `npm run lint`    | Lint with Oxlint                              |
| `npm run preview` | Serve the production build locally            |

## Project layout

```text
src/
  api/          axios client + one module per API area (auth, tasks, dashboard, admin)
  components/   shared UI (layout, modal, badges, form fields…) and tasks/ widgets
  context/      AuthProvider (who is logged in) and the useAuth hook
  hooks/        useAsync (data fetching), useDebouncedCallback, …
  pages/        one component per route
  utils/        date formatting, labels, validation rules
  types.ts      TypeScript shapes of the API's requests and responses
```

## How authentication works

- `POST /api/auth/login` returns a JWT, which is stored in `localStorage` and attached to
  every request as `Authorization: Bearer <token>` by an axios request interceptor.
- On page load, a stored token is exchanged for the current user via `GET /api/auth/me`.
- A response interceptor treats any `401` (except from the login call) as an expired or
  invalid session: it drops the token and the route guards send the user to `/login`.
- Logout just forgets the token; JWTs are stateless, so there is nothing to call.
- `ProtectedRoute` / `AdminRoute` only shape the UI. The API enforces access control itself.

Storing the token in `localStorage` keeps the client simple but means any injected script
could read it; an `httpOnly` cookie would avoid that at the cost of CSRF handling.
