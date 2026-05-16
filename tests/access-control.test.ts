/**
 * Pure logic test for role-based access rules used by middleware and API routes.
 * Mirrors the rule: only admins may access /board; users may only mutate their own todos.
 */

type Role = "admin" | "user";

function canAccessBoard(role: Role | null): boolean {
  return role === "admin";
}

function canMutateTodo(session: { uid: string; role: Role } | null, ownerId: string): boolean {
  if (!session) return false;
  return session.role === "admin" || session.uid === ownerId;
}

describe("access control rules", () => {
  it("admins can access board", () => {
    expect(canAccessBoard("admin")).toBe(true);
  });
  it("users cannot access board", () => {
    expect(canAccessBoard("user")).toBe(false);
  });
  it("anonymous cannot access board", () => {
    expect(canAccessBoard(null)).toBe(false);
  });

  it("owner can mutate their own todo", () => {
    expect(canMutateTodo({ uid: "u2", role: "user" }, "u2")).toBe(true);
  });
  it("user cannot mutate another user's todo", () => {
    expect(canMutateTodo({ uid: "u2", role: "user" }, "u1")).toBe(false);
  });
  it("admin can mutate anyone's todo", () => {
    expect(canMutateTodo({ uid: "u1", role: "admin" }, "u2")).toBe(true);
  });
  it("anonymous cannot mutate", () => {
    expect(canMutateTodo(null, "u2")).toBe(false);
  });
});
