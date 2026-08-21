import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
}).strict();

const privilegedRegisterSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["admin", "dispatcher", "driver", "warehouse_staff"]),
}).strict();

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari, samakan dengan JWT_REFRESH_EXPIRY
    path: "/api/v1/auth",
  });
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body);
      const { accessToken, refreshToken } = await authService.register(input);
      setRefreshCookie(res, refreshToken);
      res.status(201).json({ success: true, data: { accessToken }, message: "Registrasi berhasil" });
    } catch (err) {
      next(err);
    }
  },

  async registerPrivileged(req: Request, res: Response, next: NextFunction) {
    try {
      const input = privilegedRegisterSchema.parse(req.body);
      const user = await authService.registerPrivileged(input);
      const { passwordHash, ...safeUser } = user;

      res.status(201).json({
        success: true,
        data: { user: safeUser },
        message: "User berhasil dibuat",
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { accessToken, refreshToken } = await authService.login(email, password);
      setRefreshCookie(res, refreshToken);
      res.json({ success: true, data: { accessToken }, message: "Login berhasil" });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, message: "Refresh token tidak ditemukan" });
      }
      const { accessToken, refreshToken } = await authService.refresh(token);
      setRefreshCookie(res, refreshToken);
      res.json({ success: true, data: { accessToken } });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (token) await authService.logout(token);
      res.clearCookie("refreshToken", { path: "/api/v1/auth" });
      res.json({ success: true, message: "Logout berhasil" });
    } catch (err) {
      next(err);
    }
  },
};
