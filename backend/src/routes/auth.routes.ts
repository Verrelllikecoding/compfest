import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post(
  "/register/privileged",
  requireAuth,
  requireRole("admin"),
  authController.registerPrivileged
);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", requireAuth, authController.logout);
