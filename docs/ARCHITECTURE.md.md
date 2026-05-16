
The application follows a modular full-stack architecture using Next.js 14 App Router. Frontend pages, backend APIs, authentication logic, middleware, storage utilities, and testing modules are organized separately for better maintainability and scalability. Middleware validates user sessions and permissions before granting access to protected pages and APIs, ensuring secure request handling throughout the application.
# App Overview


## What It Is


A full-stack Todo application built with **Next.js 14 (App Router)**. It runs entirely as a single Next.js project — no separate backend service needed.

  
## Core Responsibilities


| Layer | Technology | Responsibility |

|---|---|---|

| UI | Next.js pages (Server Components + Client) | Login form, Todo list, Kanban board |

| Auth | `lib/auth.ts` + Next.js API routes | HMAC-signed session cookie |

| Business logic | Route handlers (`app/api/`) | CRUD, ownership checks, role guards |

| Middleware | `middleware.ts` | Route protection and role enforcement before page load |

| Storage | `lib/storage.ts` | JSON file reads/writes for users and todos |


## Design Decisions

  

**No database.** Users and todos are persisted in `data/users.json` and `data/todos.json`. This keeps the project dependency-free and easy to run locally.

  

**No external auth library.** Auth is implemented with a minimal HMAC-SHA256 signed token stored as an `HttpOnly` cookie. The token format is `base64url(payload).base64url(HMAC-SHA256(payload, AUTH_SECRET))`.

  

**No UI framework.** Styles are plain CSS in `app/globals.css`. This keeps the focus on application logic rather than component APIs.

  

**Dual-layer route protection.** `middleware.ts` intercepts requests before the page renders. Each page also performs its own server-side guard so protection holds even if middleware is bypassed or misconfigured.

  

**Role-based routing.** After login, users are redirected to their landing page based on role: admins go to `/board`, regular users go to `/todos`.

  

## Pages

  

| Path | Access | Description |

|---|---|---|

| `/login` | Public (unauthenticated only) | Login form. Redirects away if already signed in. |

| `/todos` | All authenticated users | Personal todo list with add, status toggle, and delete. |

| `/board` | Admin only | Kanban board with columns: To Do, In Progress, Done. |

  

## Notes on Vite

The original project brief mentioned "Next.js Vite". Next.js ships its own bundler (Turbopack in dev, Webpack for production builds). Combining it with Vite is non-standard and not used here. If a pure Vite + React variant is needed, that would be a separate project.

# Folder Structure

  

```

.

├── app/                          # Next.js App Router root

│   ├── api/

│   │   ├── login/route.ts        # POST /api/login

│   │   ├── logout/route.ts       # POST /api/logout

│   │   ├── me/route.ts           # GET  /api/me

│   │   └── todos/

│   │       ├── route.ts          # GET, POST /api/todos

│   │       └── [id]/route.ts     # PATCH, DELETE /api/todos/:id

│   ├── board/                    # Admin-only Kanban board page

│   ├── todos/                    # Authenticated user todo list page

│   ├── login/                    # Login page

│   ├── components/

│   │   └── Nav.tsx               # Navigation bar component

│   ├── layout.tsx                # Root layout (wraps all pages)

│   ├── page.tsx                  # / → redirects based on session

│   └── globals.css               # Global styles

│

├── lib/

│   ├── auth.ts                   # HMAC session signing/verification, login, getCurrentUser

│   └── storage.ts                # JSON file CRUD helpers (users, todos)

│

├── data/

│   ├── users.json                # Seed users (committed to repo)

│   └── todos.json                # Persisted todos (written at runtime)

│

├── middleware.ts                 # Edge middleware: route protection + role enforcement

│

├── tests/

│   ├── auth.test.ts              # Token signing, login success/failure

│   ├── storage.test.ts           # JSON CRUD against test fixtures

│   └── access-control.test.ts   # Board access and todo ownership rules

│

├── package.json

├── tsconfig.json

├── jest.config.js

└── next.config.js

```

  

## Key Files


### `middleware.ts`

Runs on the Edge before every matching request. Enforces:

- Unauthenticated users → `/login`

- Users without `admin` role hitting `/board` → `/todos?error=forbidden`

- Authenticated users hitting `/login` → their landing page

  

### `lib/auth.ts`

All auth primitives live here: `signSession`, `verifySession`, `login`, `getCurrentUser`. Nothing in this file touches the network or filesystem directly — it is pure logic plus cookie I/O via `next/headers`.

  

### `lib/storage.ts`

Abstracts all reads and writes to `data/users.json` and `data/todos.json`. Exposed functions: `getUsers`, `findUser`, `getUserById`, `getTodos`, `addTodo`, `updateTodo`, `deleteTodo`.

  
### `data/users.json`

Seeded with two users. Passwords are stored in plaintext (intentional simplification — see [Security Notes](../ARCHITECTURE/app-overview.md)).

  
### `data/todos.json`

Created and updated at runtime. Each todo record stores `id`, `title`, `status`, and `ownerId`.# Request Flow

  

## Page Request Flow

  

```

Browser

  │

  ▼

middleware.ts  ←── reads `session` cookie

  │

  ├─ No cookie → redirect /login

  ├─ Cookie invalid → redirect /login

  ├─ Role insufficient for route → redirect /todos?error=forbidden

  ├─ Authenticated hitting /login → redirect to landing page

  │

  ▼

Next.js Route Handler / Server Component

  │

  ├─ Calls getCurrentUser() → re-verifies session (second guard)

  ├─ Fetches data via storage.ts if needed

  │

  ▼

React renders page → response sent to browser

```

  

## Login Flow

  

```

Browser  POST /api/login  { username, password }

  │

  ▼

app/api/login/route.ts

  │

  ├─ findUser(username, password) via storage.ts

  │     └─ reads data/users.json, matches credentials

  │

  ├─ signSession({ id, username, role })

  │     └─ base64url(payload) + "." + base64url(HMAC-SHA256(payload, AUTH_SECRET))

  │

  ├─ Set-Cookie: session=<token>; HttpOnly; SameSite=Lax; Max-Age=604800

  │

  ▼

200 { user }   →   browser redirects to /board (admin) or /todos (user)

```

  

## Todo API Flow (Authenticated Request)

  

```

Browser  GET /api/todos  (with session cookie)

  │

  ▼

app/api/todos/route.ts

  │

  ├─ getCurrentUser() → verifySession(cookie)

  │     └─ invalid → 401

  │

  ├─ getTodos() via storage.ts

  │     └─ reads data/todos.json

  │     └─ admin → all todos; user → own todos only

  │

  ▼

200 { todos: Todo[] }

```

  

## PATCH / DELETE Flow (Ownership Check)

  

```

Browser  PATCH /api/todos/:id  { title?, status? }

  │

  ▼

app/api/todos/[id]/route.ts

  │

  ├─ getCurrentUser() → 401 if missing

  ├─ find todo by id → 404 if missing

  ├─ check: user.id === todo.ownerId OR user.role === "admin" → 403 if neither

  ├─ updateTodo(id, patch) → writes data/todos.json

  │

  ▼

200 { todo }

```

  

## Logout Flow

  

```

Browser  POST /api/logout

  │

  ▼

app/api/logout/route.ts

  │

  └─ Set-Cookie: session=; Max-Age=0   (clears cookie)

  │

  ▼

200 { ok: true }   →   browser redirects to /login

```