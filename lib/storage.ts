import fs from "fs";
import path from "path";

export type Role = "admin" | "user";

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
}

export interface Todo {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  ownerId: string;
  createdAt: number;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TODOS_FILE = path.join(DATA_DIR, "todos.json");

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export function getUsers(): User[] {
  return readJson<User[]>(USERS_FILE, []);
}

export function findUser(username: string, password: string): User | null {
  const u = getUsers().find(
    (x) => x.username === username && x.password === password
  );
  return u || null;
}

export function getUserById(id: string): User | null {
  return getUsers().find((u) => u.id === id) || null;
}

export function getTodos(): Todo[] {
  return readJson<Todo[]>(TODOS_FILE, []);
}

export function saveTodos(todos: Todo[]) {
  writeJson(TODOS_FILE, todos);
}

export function addTodo(input: { title: string; ownerId: string }): Todo {
  const todos = getTodos();
  const todo: Todo = {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    status: "todo",
    ownerId: input.ownerId,
    createdAt: Date.now(),
  };
  todos.push(todo);
  saveTodos(todos);
  return todo;
}

export function updateTodo(
  id: string,
  patch: Partial<Pick<Todo, "title" | "status">>
): Todo | null {
  const todos = getTodos();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  todos[idx] = { ...todos[idx], ...patch };
  saveTodos(todos);
  return todos[idx];
}

export function deleteTodo(id: string): boolean {
  const todos = getTodos();
  const next = todos.filter((t) => t.id !== id);
  if (next.length === todos.length) return false;
  saveTodos(next);
  return true;
}
