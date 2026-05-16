"use client";
import { useEffect, useState } from "react";

interface Todo {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  ownerId: string;
  createdAt: number;
}

export default function TodosClient() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/todos");
    if (res.ok) {
      const data = await res.json();
      setTodos(data.todos);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      setError("Failed to add");
      return;
    }
    setTitle("");
    load();
  }

  async function toggle(t: Todo) {
    const next = t.status === "done" ? "todo" : "done";
    await fetch(`/api/todos/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <form onSubmit={add} className="row" style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button className="btn" type="submit">
          Add
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {todos.length === 0 && <p style={{ color: "#94a3b8" }}>No todos yet.</p>}
      {todos.map((t) => (
        <div key={t.id} className={`todo ${t.status === "done" ? "done" : ""}`}>
          <div className="row">
            <input
              type="checkbox"
              checked={t.status === "done"}
              onChange={() => toggle(t)}
            />
            <span className="title">{t.title}</span>
          </div>
          <button className="btn danger" onClick={() => remove(t.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
