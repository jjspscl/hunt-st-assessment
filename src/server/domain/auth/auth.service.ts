import { AuthRepository } from "./auth.repository";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;
const SESSION_TTL_HOURS = 24;

export class AuthService {
  constructor(private repo: AuthRepository) {}

  /** Check if the IP is currently locked out */
  async isLockedOut(ipAddress: string): Promise<boolean> {
    const record = await this.repo.getLoginAttempts(ipAddress);
    if (!record || !record.lockedUntil) return false;
    return new Date(record.lockedUntil) > new Date();
  }

  /** Attempt login. Returns session token on success, or throws. */
  async login(
    password: string,
    secretPassword: string,
    ipAddress: string
  ): Promise<{ token: string } | { error: string; status: 401 | 429 }> {
    // Check lockout first
    if (await this.isLockedOut(ipAddress)) {
      return { error: "Too many attempts. Try again later.", status: 429 };
    }

    if (password !== secretPassword) {
      // Increment failed attempts
      const record = await this.repo.getLoginAttempts(ipAddress);
      const currentAttempts = (record?.attempts ?? 0) + 1;

      let lockedUntil: string | null = null;
      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockTime = new Date();
        lockTime.setMinutes(lockTime.getMinutes() + LOCKOUT_MINUTES);
        lockedUntil = lockTime.toISOString();
      }

      await this.repo.upsertLoginAttempt(ipAddress, currentAttempts, lockedUntil);
      return { error: "Invalid password", status: 401 };
    }

    // Successful login — reset attempts and create session
    await this.repo.resetLoginAttempts(ipAddress);

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS);

    await this.repo.createSession(token, expiresAt.toISOString());
    return { token };
  }

  /** Validate a session token. Returns true if valid. */
  async validateSession(token: string): Promise<boolean> {
    const session = await this.repo.findSession(token);
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
  }

  /** Logout — delete the session */
  async logout(token: string): Promise<void> {
    await this.repo.deleteSession(token);
  }
}
