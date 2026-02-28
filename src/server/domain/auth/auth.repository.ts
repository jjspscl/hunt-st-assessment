import { eq } from "drizzle-orm";
import { sessions, loginAttempts } from "../auth/auth.schema";
import type { Database } from "../../db";

export class AuthRepository {
  constructor(private db: Database) {}

  // --- Sessions ---

  async createSession(token: string, expiresAt: string) {
    await this.db.insert(sessions).values({
      token,
      expiresAt,
    });
  }

  async findSession(token: string) {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);
    return session ?? null;
  }

  async deleteSession(token: string) {
    await this.db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteAllSessions() {
    await this.db.delete(sessions);
  }

  // --- Login Attempts ---

  async getLoginAttempts(ipAddress: string) {
    const [record] = await this.db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ipAddress, ipAddress))
      .limit(1);
    return record ?? null;
  }

  async upsertLoginAttempt(
    ipAddress: string,
    attempts: number,
    lockedUntil: string | null
  ) {
    await this.db
      .insert(loginAttempts)
      .values({
        ipAddress,
        attempts,
        lastAttempt: new Date().toISOString(),
        lockedUntil,
      })
      .onConflictDoUpdate({
        target: loginAttempts.ipAddress,
        set: {
          attempts,
          lastAttempt: new Date().toISOString(),
          lockedUntil,
        },
      });
  }

  async resetLoginAttempts(ipAddress: string) {
    await this.db
      .delete(loginAttempts)
      .where(eq(loginAttempts.ipAddress, ipAddress));
  }

  async deleteAllLoginAttempts() {
    await this.db.delete(loginAttempts);
  }
}
