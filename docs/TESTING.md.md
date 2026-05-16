
The project includes automated testing using Jest and ts-jest to validate authentication logic, access-control rules, storage operations, and todo management functionality. Tests help ensure application reliability, security, and maintainability by verifying that core business logic behaves correctly under different scenarios.c
# Test Strategy


## Overview

  

Tests run under **Jest** with **ts-jest** in a pure Node.js environment — no DOM or browser required. All test files live in `tests/`.

  
The test suite focuses on three areas: auth primitives, storage helpers, and access-control rules. These are the core logic layers of the app; UI behaviour is covered by the [Manual QA Checklist](../DEV/local-setup.md#manual-qa-checklist).

  

## Test Files

  

| File | What it covers |

|---|---|

| `tests/auth.test.ts` | Token signing/verification, login success and failure |

| `tests/storage.test.ts` | JSON file CRUD against isolated fixture data |

| `tests/access-control.test.ts` | Board access rules and todo ownership checks |

  

## Isolation Strategy

  

Storage and auth tests set `DATA_DIR=tests/fixtures` so all reads and writes go to a dedicated fixtures directory. The real `data/` files are never touched during a test run.

  

## What Is and Isn't Tested

  

**Tested:**

- HMAC token round-trips and tamper detection

- `findUser`, `getUserById`, `addTodo`, `updateTodo`, `deleteTodo` functions

- Role-based board access rules (admin/user/anonymous)

- Todo mutation ownership rules (owner/non-owner/admin/anonymous)

  

**Not tested (covered by manual QA or out of scope):**

- Next.js routing and redirect behaviour

- Cookie setting/clearing in HTTP responses

- UI rendering and interactions

- Concurrent write safety (known limitation, not a test gap)

  

## Running Tests

  

Run the full suite:

```bash

npm test

```

  

Run a single file:

```bash

npx jest tests/auth.test.ts

```

  

Watch mode during development:

```bash

npx jest --watch

```

  

## Configuration

  

Jest is configured in `jest.config.js` with `ts-jest` as the transform. TypeScript paths and module resolution follow `tsconfig.json`.

# Unit Tests

  

## tests/auth.test.ts

  

Tests the `signSession`, `verifySession`, and `login` functions from `lib/auth.ts`.

  

**Setup:** Sets `AUTH_SECRET` via environment variable before each test. No file I/O.

  

**Covered scenarios:**

- A signed payload survives a `signSession` → `verifySession` round-trip and returns the original data.

- A token with a tampered signature is rejected by `verifySession`.

- `verifySession` returns `null` for `undefined` input.

- `verifySession` returns `null` for a malformed (non-dot-separated) token.

- `login("sivasakthi", "12345")` succeeds and returns `{ role: "admin" }`.

- `login("user", "password")` succeeds and returns `{ role: "user" }`.

- `login("sivasakthi", "wrongpassword")` returns `null`.

- `login("nobody", "12345")` returns `null`.

  

---

  

## tests/storage.test.ts

  

Tests the storage helpers in `lib/storage.ts` against an isolated fixtures directory.

  

**Setup:** Sets `DATA_DIR=tests/fixtures` so reads/writes never touch `data/`. Fixtures contain a copy of the seed users and an empty todos array.

  

**Covered scenarios:**

- `getUsers()` returns the full list of users from the fixture.

- `findUser("sivasakthi", "12345")` returns the matching user.

- `findUser("sivasakthi", "wrong")` returns `null`.

- `getUserById("1")` returns the correct user.

- `getUserById("999")` returns `null`.

- `addTodo("Buy milk", "2")` creates a todo with `status: "todo"` and `ownerId: "2"`, and persists it.

- `updateTodo(id, { title: "Updated" })` patches only the title and returns the updated record.

- `updateTodo(id, { status: "done" })` patches only the status.

- `updateTodo("nonexistent-id", {})` returns `null`.

- `deleteTodo(id)` removes the todo and returns `true`.

- `deleteTodo("nonexistent-id")` returns `false`.

  

---

  

## tests/access-control.test.ts

  

Tests pure access-control rule functions (no HTTP, no file I/O).

  

**Setup:** In-memory user and todo objects — no fixtures needed.

  

**Covered scenarios:**

  

Board access:

- An `admin` user can access the board.

- A `user` role cannot access the board.

- An unauthenticated (null) user cannot access the board.

  

Todo mutation (PATCH / DELETE ownership):

- A user whose `id` matches `todo.ownerId` can mutate the todo.

- A user whose `id` does not match `todo.ownerId` and is not an admin cannot mutate.

- An `admin` user can mutate any todo regardless of `ownerId`.

- An unauthenticated (null) user cannot mutate any todo.


# Test Cases

  

Full list of test cases across all three test files.

  

---

  

## Auth (`tests/auth.test.ts`)

  

| # | Test | Expected |

|---|---|---|

| 1 | Sign a payload and verify it round-trips | Returns original payload object |

| 2 | Verify a token with a tampered signature | Returns `null` |

| 3 | Verify `undefined` | Returns `null` |

| 4 | Verify a malformed token (no dot separator) | Returns `null` |

| 5 | Login with admin credentials (`sivasakthi` / `12345`) | Returns user with `role: "admin"` |

| 6 | Login with user credentials (`user` / `password`) | Returns user with `role: "user"` |

| 7 | Login with correct username, wrong password | Returns `null` |

| 8 | Login with unknown username | Returns `null` |

  

---

  

## Storage (`tests/storage.test.ts`)

  

| # | Test | Expected |

|---|---|---|

| 1 | `getUsers()` reads fixture file | Returns array with all seeded users |

| 2 | `findUser("sivasakthi", "12345")` | Returns matching user object |

| 3 | `findUser("sivasakthi", "wrong")` | Returns `null` |

| 4 | `getUserById("1")` | Returns correct user |

| 5 | `getUserById("999")` | Returns `null` |

| 6 | `addTodo("Buy milk", "2")` | Creates todo with `status: "todo"`, `ownerId: "2"`, persisted to fixture |

| 7 | `updateTodo(id, { title: "New title" })` | Returns todo with updated title, other fields unchanged |

| 8 | `updateTodo(id, { status: "done" })` | Returns todo with updated status, title unchanged |

| 9 | `updateTodo("nonexistent", {})` | Returns `null` |

| 10 | `deleteTodo(id)` (existing todo) | Returns `true`, todo removed from file |

| 11 | `deleteTodo("nonexistent")` | Returns `false` |

  

---

  

## Access Control (`tests/access-control.test.ts`)

  

| # | Test | Expected |

|---|---|---|

| 1 | Admin user → can access board | `true` |

| 2 | `user` role → cannot access board | `false` |

| 3 | Unauthenticated (null) → cannot access board | `false` |

| 4 | User is todo owner → can mutate | `true` |

| 5 | User is not owner, not admin → cannot mutate | `false` |

| 6 | Admin user → can mutate any todo | `true` |

| 7 | Unauthenticated (null) → cannot mutate | `false` |

  

---

  

## Manual QA Checklist

  

These scenarios are not automated — verify them manually after making changes:

  

1. Start dev server → visit `/` → should redirect to `/login`.

2. Log in as `user` / `password` → lands on `/todos`. Add a todo, change its status, delete it.

3. While logged in as `user`, manually visit `/board` → should redirect to `/todos?error=forbidden`.

4. Log out. Log in as `sivasakthi` / `12345` → lands on `/board`. Move a todo across columns.

5. Verify `data/todos.json` reflects the status change from step 4.

6. Without a session cookie, call `POST /api/todos` (e.g. via curl) → should return `401`.