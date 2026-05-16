
The application includes secure login and logout functionality using signed HttpOnly session cookies. Authenticated users can create, update, delete, and manage their personal todos, while administrators have access to an additional Kanban Board interface. The system implements role-based access control, protected routes, middleware-based authorization, session validation, and persistent JSON-based storage for managing application data securely and efficiently


# Authentication

  

## Overview

  

Authentication uses a minimal HMAC-SHA256 signed session token stored as an `HttpOnly` cookie. There is no third-party auth library — all logic lives in `lib/auth.ts`.

  

## Session Token Format

  

```

base64url(payload) + "." + base64url(HMAC-SHA256(payload, AUTH_SECRET))

```

  

The payload is a JSON object containing `{ id, username, role }`.

  

On every protected request, `verifySession` splits the token, recomputes the HMAC, and compares it to the signature using a timing-safe comparison. If they don't match, or the token is malformed, the session is rejected.

  

## Cookie Properties

  

| Property | Value |

|---|---|

| Name | `session` |

| `HttpOnly` | Yes — not accessible to JavaScript |

| `SameSite` | `Lax` — protects against CSRF on cross-site navigations |

| `Max-Age` | 604800 (7 days) |

| `Path` | `/` |

  

## Login

  

`POST /api/login` accepts `{ username, password }`.

  

1. `findUser` reads `data/users.json` and checks credentials.

2. On success, `signSession` creates the token.

3. The token is written to the `session` cookie in the response.

4. The response body returns `{ user: { id, username, role } }`.

  

On failure: `401 { error: "Invalid credentials" }`.

  

## Logout

  

`POST /api/logout` clears the cookie by setting `Max-Age=0`. No server-side session store needs to be invalidated.

  

## getCurrentUser

  

`getCurrentUser()` is a server-side helper used in route handlers and server components. It reads the `session` cookie from `next/headers` and calls `verifySession`. Returns the user object or `null`.

  

## Security Notes

  

- **Passwords are stored in plaintext** in `data/users.json`. This is an intentional simplification. In production, hash passwords with `bcrypt` or `argon2`.

- **`AUTH_SECRET` defaults to `dev-secret-change-me`.** Always set a long random value in production via `.env.local`.

- The token is not a full JWT. For production systems, consider `jose` or `next-auth`.

  

See [Environment Variables](../DEV/environment.md) for configuration.


# Role-Based Access Control (RBAC)

  

## Roles

  

| Role | Description |

|---|---|

| `admin` | Full access — todos list, Kanban board, and all todos (not just own) |

| `user` | Restricted access — todos list only, own todos only |

  

## Route Protection

  

Protection is enforced in two places:

  

**`middleware.ts` (Edge, runs before the page)**

- Any unauthenticated request to a protected route → redirect `/login`

- Authenticated `user` role request to `/board/*` → redirect `/todos?error=forbidden`

- Authenticated request to `/login` → redirect to role-appropriate landing page

  

**Server components and route handlers (second guard)**

- Each page calls `getCurrentUser()` server-side and re-checks the role.

- API routes verify the session and ownership independently of middleware.

  

This dual-layer approach means protection holds even if middleware configuration changes.

  

## Protected Routes

  

| Route | Minimum role |

|---|---|

| `/todos` | `user` (any authenticated user) |

| `/board` | `admin` |

| `/api/todos` (GET, POST) | any authenticated |

| `/api/todos/:id` (PATCH, DELETE) | owner OR `admin` |

  

## Landing Page by Role

  

After a successful login:

  

| Role | Landing page |

|---|---|

| `admin` | `/board` |

| `user` | `/todos` |

  

## Admin Privileges on Todos

  

- `GET /api/todos` — admin receives **all** todos across all users; regular users only receive their own.

- `PATCH /api/todos/:id` — admin can update any todo regardless of `ownerId`.

- `DELETE /api/todos/:id` — admin can delete any todo regardless of `ownerId`.

  

## Adding Roles

  

Roles are stored in `data/users.json` as the `role` field. The current values are `"admin"` and `"user"`. To add a new role, update `users.json` and add corresponding checks in `middleware.ts` and the relevant route handlers.


# Todo Management

  

## Todo Schema

  

Each todo stored in `data/todos.json` has the following shape:

  

```ts

{

  id: string;          // UUID generated at creation

  title: string;       // User-provided title

  status: "todo" | "in_progress" | "done";

  ownerId: string;     // User ID of the creator

}

```

  

## Creating a Todo

  

`POST /api/todos` with body `{ title: string }`.

  

- Requires an authenticated session.

- `ownerId` is set automatically from the session user.

- Initial `status` is always `"todo"`.

- Returns `201 { todo }`.

  

## Reading Todos

  

`GET /api/todos`

  

- Authenticated users receive only their own todos (`ownerId === user.id`).

- Admin users receive all todos across all users.

  

## Updating a Todo

  

`PATCH /api/todos/:id` with body `{ title?: string, status?: string }`.

  

- Only the owner or an admin may update a todo.

- Non-owner, non-admin → `403 Forbidden`.

- Missing todo → `404 Not Found`.

- Both `title` and `status` are optional — send only what you want to change.

  

Valid `status` values: `"todo"`, `"in_progress"`, `"done"`.

  

## Deleting a Todo

  

`DELETE /api/todos/:id`

  

- Only the owner or an admin may delete a todo.

- Non-owner, non-admin → `403 Forbidden`.

- Missing todo → `404 Not Found`.

- Returns `{ ok: true }` on success.

  

## UI Views

  

**`/todos` — Personal list view**

All authenticated users can access this. Shows only the current user's todos. Supports adding new todos, changing status, and deleting.

  

**`/board` — Kanban board (admin only)**

Shows all todos grouped into three columns: **To Do**, **In Progress**, **Done**. Todos can be dragged or moved between columns. All changes persist immediately to `data/todos.json`.

  

## Persistence

  

All todo operations are persisted synchronously to `data/todos.json` via `lib/storage.ts`. The file is read on every request and written after every mutation. This is suitable for local/dev usage but is not concurrency-safe for multi-instance deployments.