import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { deleteTodo, getTodos, updateTodo } from "@/lib/storage";

function canAccess(session: { uid: string; role: string }, todoOwnerId: string) {
  return session.role === "admin" || session.uid === todoOwnerId;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const target = getTodos().find((t) => t.id === params.id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(session, target.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const patch: { title?: string; status?: "todo" | "in_progress" | "done" } = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (["todo", "in_progress", "done"].includes(body.status)) patch.status = body.status;
  const updated = updateTodo(params.id, patch);
  return NextResponse.json({ todo: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const target = getTodos().find((t) => t.id === params.id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(session, target.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  deleteTodo(params.id);
  return NextResponse.json({ ok: true });
}
