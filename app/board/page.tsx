import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Nav from "../components/Nav";
import BoardClient from "./BoardClient";

export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/todos?error=forbidden");
  return (
    <>
      <Nav username={user.username} role={user.role} />
      <div className="container">
        <h1>Board (Admin)</h1>
        <p style={{ color: "#94a3b8" }}>All todos across all users.</p>
        <BoardClient />
      </div>
    </>
  );
}
