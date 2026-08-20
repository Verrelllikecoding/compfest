import bcrypt from "bcryptjs";
import crypto from "crypto";
import { userRepository, refreshTokenRepository } from "../repositories/user.repository";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiryDate,
} from "../utils/jwt";
import { Role } from "@prisma/client";

const BCRYPT_ROUNDS = 10; // minimal sesuai SRD §3 Security

function hashToken(token: string) {
  // Refresh token disimpan sebagai hash saja (SRD §3), pakai SHA-256 karena
  // tokennya sendiri sudah acak & panjang (JWT), tidak butuh bcrypt yang lambat.
  return crypto.createHash("sha256").update(token).digest("hex");
}

class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export const authService = {
  async register(input: { name: string; email: string; password: string; role: Role }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AuthError("Email sudah terdaftar", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    return authService.issueTokens(user.id, user.role);
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new AuthError("Email atau password salah");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthError("Email atau password salah");
    }

    return authService.issueTokens(user.id, user.role);
  },

  async issueTokens(userId: string, role: string) {
    const accessToken = signAccessToken({ sub: userId, role });
    const refreshToken = signRefreshToken({ sub: userId, role });

    await refreshTokenRepository.create({
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: refreshTokenExpiryDate(),
    });

    return { accessToken, refreshToken };
  },

  async refresh(oldRefreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new AuthError("Refresh token tidak valid atau kedaluwarsa", 403);
    }

    const stored = await refreshTokenRepository.findByHash(hashToken(oldRefreshToken));
    if (!stored || stored.expiresAt < new Date()) {
      throw new AuthError("Refresh token tidak valid atau kedaluwarsa", 403);
    }

    // Rotasi: cabut token lama, terbitkan pasangan baru
    await refreshTokenRepository.revoke(stored.id);
    return authService.issueTokens(payload.sub, payload.role);
  },

  async logout(refreshToken: string) {
    const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
    if (stored) {
      await refreshTokenRepository.revoke(stored.id);
    }
  },
};

export { AuthError };
