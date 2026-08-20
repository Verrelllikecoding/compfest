import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: { name: string; email: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data });
  },
};

export const refreshTokenRepository = {
  create(data: { tokenHash: string; userId: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  findByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({ where: { tokenHash, isRevoked: false } });
  },

  revoke(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { isRevoked: true } });
  },

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } });
  },
};
