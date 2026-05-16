import fs from "fs";
import path from "path";

const FIXTURES = path.join(__dirname, "fixtures");
process.env.DATA_DIR = FIXTURES;

// Re-require storage after env is set
import {
  getUsers,
  findUser,
  getUserById,
  addTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  saveTodos,
} from "../lib/storage";

beforeAll(() => {
  fs.mkdirSync(FIXTURES, { recursive: true });
  fs.writeFileSync(
    path.join(FIXTURES, "users.json"),
    JSON.stringify([
      { id: "u1", username: "sivasakthi", password: "12345", role: "admin" },
      { id: "u2", username: "user", password: "password", role: "user" },
    ])
  );
});

beforeEach(() => {
  saveTodos([]);
});

afterAll(() => {
  fs.rmSync(FIXTURES, { recursive: true, force: true });
});

describe("users", () => {
  it("loads all users", () => {
    expect(getUsers()).toHaveLength(2);
  });

  it("findUser returns the matching user", () => {
    expect(findUser("sivasakthi", "12345")?.role).toBe("admin");
    expect(findUser("user", "password")?.role).toBe("user");
  });

  it("findUser returns null for invalid creds", () => {
    expect(findUser("sivasakthi", "wrong")).toBeNull();
  });

  it("getUserById finds a user", () => {
    expect(getUserById("u1")?.username).toBe("sivasakthi");
    expect(getUserById("missing")).toBeNull();
  });
});

describe("todos crud", () => {
  it("adds a todo with status 'todo' and ownerId", () => {
    const todo = addTodo({ title: "Buy milk", ownerId: "u2" });
    expect(todo.title).toBe("Buy milk");
    expect(todo.status).toBe("todo");
    expect(todo.ownerId).toBe("u2");
    expect(getTodos()).toHaveLength(1);
  });

  it("updates a todo", () => {
    const todo = addTodo({ title: "T", ownerId: "u1" });
    const updated = updateTodo(todo.id, { status: "done", title: "Renamed" });
    expect(updated?.status).toBe("done");
    expect(updated?.title).toBe("Renamed");
  });

  it("returns null when updating a missing todo", () => {
    expect(updateTodo("nope", { status: "done" })).toBeNull();
  });

  it("deletes a todo", () => {
    const todo = addTodo({ title: "T", ownerId: "u1" });
    expect(deleteTodo(todo.id)).toBe(true);
    expect(getTodos()).toHaveLength(0);
  });

  it("returns false when deleting a missing todo", () => {
    expect(deleteTodo("nope")).toBe(false);
  });
});
