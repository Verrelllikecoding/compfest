import { Router } from "express";

import {
  requireAuth,
  requireRole,
  AuthRequest,
} from "../middlewares/auth.middleware";

import { userRepository } from "../repositories/user.repository";

export const userRouter = Router();

/* =========================================================
   ASSIGNABLE USERS
========================================================= */

userRouter.get(
  "/assignees",
  requireAuth,
  requireRole("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const users =
        await userRepository.findAssignableUsers();

      return res.json({
        success: true,
        data: users,
        message: "Daftar assignee berhasil diambil",
      });
    } catch (err) {
      next(err);
    }
  }
);

/* =========================================================
   CURRENT USER
========================================================= */

userRouter.get(
  "/me",
  requireAuth,
  async (
    req: AuthRequest,
    res,
    next
  ) => {
    try {
      const user =
        await userRepository.findById(
          req.user!.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User tidak ditemukan",
        });
      }

      const {
        passwordHash,
        ...safeUser
      } = user;

      return res.json({
        success: true,
        data: safeUser,
      });
    } catch (err) {
      next(err);
    }
  }
);