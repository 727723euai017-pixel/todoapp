# Todo App (Next.js + JSON Auth Server)

A simple full-stack Todo application built with **Next.js 14 (App Router)**. It includes:

- A built-in **auth server** (Next.js API routes) using a signed HMAC session cookie.
- **Role-based access control**: admins can access the **Board** view; normal users cannot.
- **Local JSON file storage** for users and todos — no database required.
- **Jest test suite** covering auth, storage, and access-control rules.

> Note on Vite: The original request mentioned "Next.js Vite". Next.js ships its own bundler (Turbopack/Webpack), so combining it with Vite isn't standard. This project uses Next.js only. If you need a pure Vite + React variant instead, let me know.

---

## 1. Features

- Login / Logout with cookie session (`HttpOnly`, `SameSite=Lax`).
- Two seed users in `data/users.json`:
  | Username     | Password   | Role  |
  | ------------ | ---------- | ----- |
  | `sivasakthi` | `12345`    | admin |
  | `user`       | `password` | user  |
- Pages:
  - `/login` — login form (auto-redirects if already signed in).
  - `/todos` — personal todo list. Available to **all** authenticated users.
  - `/board` — Kanban board (To Do / In Progress / Done). **Admin only**.
- Route protection via `middleware.ts` + server-side guards inside each page.
- Todo CRUD via `/api/todos` and `/api/todos/[id]`. Users see only their own todos; admins see all.

---

## 2. Tech Stack

- **Next.js 14** (App Router, server components, route handlers)
- **React 18**, **TypeScript**
- **Jest** + **ts-jest** for testing
- Plain CSS (no UI framework, kept minimal)

---

## 3. Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── login/route.ts        # POST /api/login
│   │   ├── logout/route.ts       # POST /api/logout
│   │   ├── me/route.ts           # GET  /api/me
│   │   └── todos/
│   │       ├── route.ts          # GET, POST /api/todos
│   │       └── [id]/route.ts     # PATCH, DELETE /api/todos/:id
│   ├── board/                    # Admin-only board page
│   ├── todos/                    # User todo list page
│   ├── login/                    # Login page
│   ├── components/Nav.tsx
│   ├── layout.tsx
│   ├── page.tsx                  # /  → redirects based on session
│   └── globals.css
├── lib/
│   ├── auth.ts                   # HMAC-signed session, login, getCurrentUser
│   └── storage.ts                # JSON file CRUD helpers
├── data/
│   ├── users.json                # Seed users (committed)
│   └── todos.json                # Persisted todos
├── middleware.ts                 # Route protection + role enforcement
├── tests/
│   ├── auth.test.ts
│   ├── storage.test.ts
│   └── access-control.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── next.config.js
```

---

## 4. Getting Started

### Prerequisites

- Node.js **18+**

### Install

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

Open <http://localhost:3000>. You will be redirected to `/login`.

Try the seeded credentials:

- **Admin** → `sivasakthi` / `12345` (lands on `/board`)
- **User**  → `user` / `password` (lands on `/todos`; `/board` is forbidden)

### Build / Start

```bash
npm run build
npm start
```

---

## 5. Auth Flow

1. `POST /api/login` with `{ username, password }`.
2. Server verifies against `data/users.json`, then issues a session token: `base64url(payload).base64url(HMAC-SHA256(payload, AUTH_SECRET))`.
3. Token is set as an `HttpOnly` cookie named `session` (7-day expiry).
4. `middleware.ts` verifies the cookie on every request to `/`, `/login`, `/todos/*`, `/board/*`:
   - Unauthenticated → redirected to `/login`.
   - Authenticated user hitting `/board` without `admin` role → redirected to `/todos?error=forbidden`.
   - Authenticated user hitting `/login` → redirected to their landing page.
5. `POST /api/logout` clears the cookie.

### Environment variables

| Var           | Default              | Purpose                              |
| ------------- | -------------------- | ------------------------------------ |
| `AUTH_SECRET` | `dev-secret-change-me` | HMAC key for signing session tokens. **Set this in production.** |
| `DATA_DIR`    | `<cwd>/data`         | Override the JSON storage directory (used by tests). |

Create a `.env.local` for production:

```
AUTH_SECRET=replace-with-a-long-random-string
```

---

## 6. API Reference

All endpoints accept/return JSON. Authenticated endpoints require the `session` cookie.

| Method | Path                | Auth   | Body                        | Response                              |
| ------ | ------------------- | ------ | --------------------------- | ------------------------------------- |
| POST   | `/api/login`        | none   | `{ username, password }`    | `200 { user }` or `401 { error }`     |
| POST   | `/api/logout`       | none   | —                           | `200 { ok: true }`                    |
| GET    | `/api/me`           | yes    | —                           | `{ user }` or `401`                   |
| GET    | `/api/todos`        | yes    | —                           | `{ todos: Todo[] }` (admin sees all)  |
| POST   | `/api/todos`        | yes    | `{ title }`                 | `201 { todo }`                        |
| PATCH  | `/api/todos/:id`    | yes\*  | `{ title?, status? }`       | `{ todo }` / `403` / `404`            |
| DELETE | `/api/todos/:id`    | yes\*  | —                           | `{ ok: true }` / `403` / `404`        |

\* Owner or admin only.

`Todo.status` ∈ `"todo" | "in_progress" | "done"`.

---

## 7. Testing

Tests live in `tests/` and run under Node.js (no DOM needed). They cover:

- `auth.test.ts` — token signing/verification, login success and failure paths.
- `storage.test.ts` — JSON file CRUD against an isolated fixtures directory.
- `access-control.test.ts` — pure rule checks for board access and todo ownership.

Run all tests:

```bash
npm test
```

Run a single file:

```bash
npx jest tests/auth.test.ts
```

The storage and auth tests set `DATA_DIR=tests/fixtures` so your real `data/` is never touched.

### Test Cases Overview

**Auth (`tests/auth.test.ts`)**
- Round-trip valid session payload through `signSession`/`verifySession`.
- Reject a tampered signature.
- Reject undefined / malformed tokens.
- Login succeeds with admin creds and returns role `admin`.
- Login succeeds with normal user creds and returns role `user`.
- Login fails on wrong password.
- Login fails on unknown username.

**Storage (`tests/storage.test.ts`)**
- Loads all users.
- `findUser` returns matching user, `null` on bad creds.
- `getUserById` finds and misses correctly.
- `addTodo` creates with `status: "todo"` and stores ownerId.
- `updateTodo` patches title and status; returns `null` when missing.
- `deleteTodo` removes; returns `false` when missing.

**Access control (`tests/access-control.test.ts`)**
- Admin can access board; user cannot; anonymous cannot.
- Todo owner can mutate own todo.
- Non-owner user cannot mutate someone else's todo.
- Admin can mutate any todo.
- Anonymous cannot mutate.

---

## 8. Manual QA Checklist

1. Start dev server, visit `/` → redirects to `/login`.
2. Log in as `user` / `password` → lands on `/todos`. Add a todo, toggle, delete.
3. Manually visit `/board` → bounced back to `/todos?error=forbidden`.
4. Log out, log in as `sivasakthi` / `12345` → lands on `/board`. Move a todo across columns.
5. Verify `data/todos.json` reflects the changes.
6. Try `POST /api/todos` without the cookie (e.g., `curl -X POST http://localhost:3000/api/todos`) → `401`.

---

## 9. Security Notes (and what's intentionally simplified)

- **Passwords are stored in plaintext** in `users.json` because the spec says "no database" and explicitly seeds `12345` / `password`. For a real deployment, hash with `bcrypt`/`argon2`.
- **`AUTH_SECRET` defaults to a dev string.** Always override in production.
- The session token is a minimal HMAC blob (not full JWT). Sufficient for this exercise; use `jose`/`next-auth` for real systems.
- File-based storage is **not concurrency-safe**. It's fine for local/dev/testing, not for multi-instance deployments.

---

## 10. Scripts

| Script          | Purpose                  |
| --------------- | ------------------------ |
| `npm run dev`   | Start Next.js dev server |
| `npm run build` | Production build         |
| `npm start`     | Run production build     |
| `npm test`      | Run Jest test suite      |
| `npm run lint`  | Next.js lint             |
