import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthError } from "../services/auth.service";
import { NotFoundError } from "../services/warehouse.service";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.errors[0]?.message || "Input tidak valid",
    });
  }

  if (err instanceof AuthError || err instanceof NotFoundError) {
    return res.status((err as any).status || 400).json({ success: false, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
}
