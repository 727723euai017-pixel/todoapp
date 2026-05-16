// Edge-safe session helpers. NO Node-only imports here (no fs, path, crypto module).
// Uses the Web Crypto API which is available in both Node 18+ and the Edge runtime.

export const COOKIE_NAME = "session";

export interface SessionPayload {
  uid: string;
  username: string;
  role: "admin" | "user";
  iat: number;
}

const SECRET =
  (typeof process !== "undefined" && process.env && process.env.AUTH_SECRET) ||
  "dev-secret-change-me";

const enc = new TextEncoder();

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa is available in both Node 18+ and Edge.
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64UrlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const body = bytesToB64Url(enc.encode(JSON.stringify(payload)));
  const key = await getKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const sig = bytesToB64Url(new Uint8Array(sigBuf));
  return `${body}.${sig}`;
}

export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  try {
    const key = await getKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64UrlToBytes(sig),
      enc.encode(body)
    );
    if (!ok) return null;
    const json = new TextDecoder().decode(b64UrlToBytes(body));
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}
