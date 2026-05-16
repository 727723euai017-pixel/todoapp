"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Nav({ username, role }: { username: string; role: "admin" | "user" }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <div className="nav">
      <div>
        <Link href="/todos">My Todos</Link>
        {role === "admin" && <Link href="/board">Board</Link>}
      </div>
      <div className="row">
        <span className="tag">
          {username} · {role}
        </span>
        <button className="btn secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
