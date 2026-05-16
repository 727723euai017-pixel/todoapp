The API layer is implemented using Next.js Route Handlers and manages all communication between the frontend and backend systems. APIs handle authentication, logout, session validation, and todo CRUD operations. Protected endpoints verify session cookies and enforce role-based authorization rules before processing requests and returning JSON responses.
# Auth API

Base URL: `http://localhost:3000` (dev)

All endpoints accept and return `application/json`.

  
## POST /api/login

Authenticates a user and sets the session cookie.

**Auth required:** No

**Request body:**

```json

{ "username": "sivasakthi", "password": "12345" }

```

  

**Responses:**

  

`200 OK`

```json

{ "user": { "id": "1", "username": "sivasakthi", "role": "admin" } }

```

Sets `Set-Cookie: session=<token>; HttpOnly; SameSite=Lax; Max-Age=604800`

  

`401 Unauthorized`

```json

{ "error": "Invalid credentials" }

```

  
## POST /api/logout

  

Clears the session cookie.

  

**Auth required:** No (safe to call even when not logged in)

  

**Request body:** None

  

**Response:**

  

`200 OK`

```json

{ "ok": true }

```

Sets `Set-Cookie: session=; Max-Age=0` (cookie cleared)

  
## GET /api/me

  

Returns the currently authenticated user from the session cookie.

  

**Auth required:** Yes (session cookie)

  

**Response:**

  

`200 OK`

```json

{ "user": { "id": "1", "username": "sivasakthi", "role": "admin" } }

```

  

`401 Unauthorized`

```json

{ "error": "Unauthorized" }

```


## Notes

  

- All session validation is performed server-side by verifying the HMAC signature on the cookie.

- The cookie is `HttpOnly` and cannot be read or modified by client-side JavaScript.

- Tokens expire after 7 days. There is no refresh mechanism — users must log in again after expiry.

# Todo API

  

Base URL: `http://localhost:3000` (dev)

  

All endpoints require the `session` cookie (set on login). Requests without a valid session return `401`.

  

`Todo.status` must be one of: `"todo"` | `"in_progress"` | `"done"`

  


## GET /api/todos

  

Returns todos for the authenticated user.

  

**Auth required:** Yes

  

**Response:**

  

`200 OK`

```json

{

  "todos": [

    { "id": "abc123", "title": "Write tests", "status": "todo", "ownerId": "1" }

  ]

}

```

  

- Regular users receive only their own todos (`ownerId === user.id`).

- Admin users receive all todos regardless of owner.

  

`401 Unauthorized` — missing or invalid session cookie.

  

---

  

## POST /api/todos

  

Creates a new todo.

  

**Auth required:** Yes

  

**Request body:**

```json

{ "title": "Write tests" }

```

  

**Response:**

  

`201 Created`

```json

{ "todo": { "id": "abc123", "title": "Write tests", "status": "todo", "ownerId": "1" } }

```

  

- `ownerId` is set from the session user automatically.

- Initial `status` is always `"todo"`.

  

`401 Unauthorized` — missing or invalid session.

  

---

  

## PATCH /api/todos/:id

  

Updates a todo's title and/or status.

  

**Auth required:** Yes — owner or admin only

  

**URL parameter:** `id` — the todo's ID

  

**Request body (all fields optional):**

```json

{ "title": "Updated title", "status": "in_progress" }

```

  

**Responses:**

  

`200 OK`

```json

{ "todo": { "id": "abc123", "title": "Updated title", "status": "in_progress", "ownerId": "1" } }

```

  

`403 Forbidden` — authenticated but not the owner and not an admin.

  

`404 Not Found` — no todo with that ID exists.

  

`401 Unauthorized` — missing or invalid session.

  

---

  

## DELETE /api/todos/:id

  

Deletes a todo.

  

**Auth required:** Yes — owner or admin only

  

**URL parameter:** `id` — the todo's ID

  

**Responses:**

  

`200 OK`

```json

{ "ok": true }

```

  

`403 Forbidden` — authenticated but not the owner and not an admin.

  

`404 Not Found` — no todo with that ID exists.

  

`401 Unauthorized` — missing or invalid session.

  

---

  

## Quick Reference

  

| Method | Path | Auth | Body | Success |

|---|---|---|---|---|

| GET | `/api/todos` | session | — | `200 { todos }` |

| POST | `/api/todos` | session | `{ title }` | `201 { todo }` |

| PATCH | `/api/todos/:id` | owner or admin | `{ title?, status? }` | `200 { todo }` |

| DELETE | `/api/todos/:id` | owner or admin | — | `200 { ok: true }` |

  

---

  

## Example: curl

  

```bash

# Login first (saves cookie to cookie.txt)

curl -c cookie.txt -X POST http://localhost:3000/api/login \

  -H "Content-Type: application/json" \

  -d '{"username":"user","password":"password"}'

  

# Get todos

curl -b cookie.txt http://localhost:3000/api/todos

  

# Create a todo

curl -b cookie.txt -X POST http://localhost:3000/api/todos \

  -H "Content-Type: application/json" \

  -d '{"title":"My new todo"}'

  

# Update status

curl -b cookie.txt -X PATCH http://localhost:3000/api/todos/<id> \

  -H "Content-Type: application/json" \

  -d '{"status":"in_progress"}'

  

# Delete

curl -b cookie.txt -X DELETE http://localhost:3000/api/todos/<id>

```