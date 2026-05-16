import { signSession, verifySession, login } from "../lib/auth";
import path from "path";

process.env.DATA_DIR = path.join(__dirname, "fixtures");

describe("auth", () => {
  describe("signSession / verifySession", () => {
    it("round-trips a valid session payload", async () => {
      const payload = { uid: "u1", username: "sivasakthi", role: "admin" as const, iat: 1 };
      const token = await signSession(payload);
      const decoded = await verifySession(token);
      expect(decoded).toEqual(payload);
    });

    it("rejects a tampered token", async () => {
      const token = await signSession({ uid: "u1", username: "x", role: "user", iat: 1 });
      const [body] = token.split(".");
      const tampered = `${body}.invalidsig`;
      expect(await verifySession(tampered)).toBeNull();
    });

    it("rejects undefined or malformed tokens", async () => {
      expect(await verifySession(undefined)).toBeNull();
      expect(await verifySession("not-a-token")).toBeNull();
      expect(await verifySession("a.b.c")).toBeNull();
    });
  });

  describe("login", () => {
    it("succeeds with admin credentials", async () => {
      const r = await login("sivasakthi", "12345");
      expect(r).not.toBeNull();
      expect(r!.user.role).toBe("admin");
      expect(r!.token).toMatch(/^.+\..+$/);
    });

    it("succeeds with normal user credentials", async () => {
      const r = await login("user", "password");
      expect(r).not.toBeNull();
      expect(r!.user.role).toBe("user");
    });

    it("fails with wrong password", async () => {
      expect(await login("sivasakthi", "wrong")).toBeNull();
    });

    it("fails with unknown user", async () => {
      expect(await login("nobody", "x")).toBeNull();
    });
  });
});
