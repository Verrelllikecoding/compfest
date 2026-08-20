import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth.middleware";
import { userRepository } from "../repositories/user.repository";

export const userRouter = Router();

// Contoh endpoint terproteksi — dipakai frontend buat ambil data user yang lagi login
userRouter.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await userRepository.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
});
