The application uses local JSON files as its primary storage mechanism instead of a traditional database. User information and todo records are stored in structured JSON format and managed through reusable storage utility functions. This lightweight storage approach simplifies setup and makes the project suitable for development, testing, and educational purposes.
# JSON Storage

## Overview

The app uses plain JSON files for persistence instead of a database. All file I/O is handled by `lib/storage.ts`.

  

Storage location defaults to `<cwd>/data/` and can be overridden with the `DATA_DIR` environment variable (used by tests to point at fixture data without touching real files).

  

## Files

  

| File | Contents | Committed |

|---|---|---|

| `data/users.json` | Seed user records | Yes |

| `data/todos.json` | Todo records (written at runtime) | Yes (empty array `[]` initially) |

  

## Storage Helpers (`lib/storage.ts`)

  

### Users

  

`getUsers() → User[]`

Reads and parses `users.json`. Returns all user records.

  

`findUser(username, password) → User | null`

Returns the matching user if both `username` and `password` match. Returns `null` otherwise.

  

`getUserById(id) → User | null`

Returns the user with the given ID, or `null` if not found.

  

### Todos

  

`getTodos() → Todo[]`

Reads and parses `todos.json`. Returns all todo records.

  

`addTodo(title, ownerId) → Todo`

Creates a new todo with a generated UUID, `status: "todo"`, and the provided `ownerId`. Writes the updated array back to `todos.json`.

  

`updateTodo(id, patch) → Todo | null`

Applies `patch` (a partial `{ title?, status? }`) to the todo with the given ID. Writes the updated array. Returns `null` if the ID doesn't exist.

  

`deleteTodo(id) → boolean`

Removes the todo with the given ID. Returns `true` on success, `false` if not found.

  

## How Reads and Writes Work

  

Every call to a storage helper performs a fresh read from disk (`fs.readFileSync`) and parses the JSON. Writes use `fs.writeFileSync` with the full updated array serialized to JSON. There is no in-memory cache.

  

This means the data is always up to date but there is **no concurrency safety** — simultaneous writes from multiple Node.js processes can corrupt the file. This is acceptable for local/dev usage but not for production multi-instance deployments.

  

## Overriding Storage Directory

  

Set the `DATA_DIR` environment variable to point storage helpers at a different directory:

  

```

DATA_DIR=/path/to/test/fixtures

```

  

The tests use this to isolate reads/writes from `data/` during the test run. See [Environment Variables](../DEV/environment.md).

# Data Structure

## users.json

  

Located at `data/users.json`. Seeded at project setup and not modified at runtime.

  

**Schema:**

```ts

type User = {

  id: string;

  username: string;

  password: string;   // plaintext (intentional simplification — see Security Notes)

  role: "admin" | "user";

}

```

  

**Seed data:**

```json

[

  { "id": "1", "username": "sivasakthi", "password": "12345", "role": "admin" },

  { "id": "2", "username": "user", "password": "password", "role": "user" }

]

```

  

> **Security note:** Passwords are stored in plaintext because the spec seeds `12345` / `password` explicitly and requires no database. For any real deployment, hash passwords with `bcrypt` or `argon2` and never store them in plaintext.

  

---

  

## todos.json

  

Located at `data/todos.json`. Created empty on first run and updated at runtime by the storage helpers.

  

**Schema:**

```ts

type Todo = {

  id: string;                              // UUID v4

  title: string;

  status: "todo" | "in_progress" | "done";

  ownerId: string;                         // Matches a User.id

}

```

  

**Example:**

```json

[

  { "id": "f3a1c2d4-...", "title": "Write docs", "status": "in_progress", "ownerId": "1" },

  { "id": "b8e9f0a1-...", "title": "Fix login bug", "status": "todo", "ownerId": "2" }

]

```

  

---

  

## Session Payload

  

Not stored on disk — exists only in the signed cookie.

  

```ts

type SessionPayload = {

  id: string;

  username: string;

  role: "admin" | "user";

}

```

  

The payload is serialized to JSON, base64url-encoded, and signed with HMAC-SHA256 using `AUTH_SECRET`. See [Authentication](../FEATURES/authentication.md) for the token format.