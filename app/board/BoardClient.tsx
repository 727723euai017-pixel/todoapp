"use client";
import { useEffect, useState } from "react";

interface Todo {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  ownerId: string;
  createdAt: number;
}

const COLUMNS: { key: Todo["status"]; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

export default function BoardClient() {
  const [todos, setTodos] = useState<Todo[]>([]);

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

  async function move(t: Todo, status: Todo["status"]) {
    await fetch(`/api/todos/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div className="board">
      {COLUMNS.map((col) => (
        <div key={col.key} className="column">
          <h3>
            {col.label}{" "}
            <span className="tag">{todos.filter((t) => t.status === col.key).length}</span>
          </h3>
          {todos
            .filter((t) => t.status === col.key)
            .map((t) => (
              <div key={t.id} className="todo">
                <span className="title">{t.title}</span>
                <select
                  className="input"
                  style={{ width: 140 }}
                  value={t.status}
                  onChange={(e) => move(t, e.target.value as Todo["status"])}
                >
                  {COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
