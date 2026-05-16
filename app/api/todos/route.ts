import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { addTodo, getTodos } from "@/lib/storage";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = getTodos();
  // admin sees all, user only their own
  const visible = session.role === "admin" ? all : all.filter((t) => t.ownerId === session.uid);
  return NextResponse.json({ todos: visible });
}

export async function POST(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = (body.title || "").toString().trim();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const todo = addTodo({ title, ownerId: session.uid });
  return NextResponse.json({ todo }, { status: 201 });
}
