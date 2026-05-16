// Node-only auth helpers. Server components and API routes use this.
// Middleware (edge runtime) must NOT import from here — use ./session instead.
import { cookies } from "next/headers";
import { findUser, getUserById, User } from "./storage";
import { signSession, verifySession, COOKIE_NAME, SessionPayload } from "./session";

export { signSession, verifySession, COOKIE_NAME };
export type { SessionPayload };

export async function login(
  username: string,
  password: string
): Promise<{ token: string; user: User } | null> {
  const user = findUser(username, password);
  if (!user) return null;
  const token = await signSession({
    uid: user.id,
    username: user.username,
    role: user.role,
    iat: Date.now(),
  });
  return { token, user };
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySession(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const s = await getSessionFromCookies();
  if (!s) return null;
  return getUserById(s.uid);
}
