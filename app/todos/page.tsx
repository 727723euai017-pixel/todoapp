import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Nav from "../components/Nav";
import TodosClient from "./TodosClient";

export default async function TodosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <>
      <Nav username={user.username} role={user.role} />
      <div className="container">
        <h1>My Todos</h1>
        <TodosClient />
      </div>
    </>
  );
}
