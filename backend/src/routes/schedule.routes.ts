import { Router } from "express";
import { scheduleController } from "../controllers/schedule.controller";
import {
  requireAuth,
  requireRole,
} from "../middlewares/auth.middleware";

export const scheduleRouter = Router();

/*
 * Semua endpoint schedule wajib login.
 */

// List jadwal
scheduleRouter.get(
  "/",
  requireAuth,
  scheduleController.list
);

// Calendar
// PENTING: /calendar harus diletakkan sebelum /:id
scheduleRouter.get(
  "/calendar",
  requireAuth,
  scheduleController.calendar
);

scheduleRouter.post(
  "/recommend-slot",
  requireAuth,
  requireRole("admin", "dispatcher"),
  scheduleController.recommendSlot
);

scheduleRouter.post(
  "/recommend-best-slot",
  requireAuth,
  requireRole(
    "admin",
    "dispatcher"
  ),
  scheduleController.recommendBestSlot
);

// Detail schedule
scheduleRouter.get(
  "/:id",
  requireAuth,
  scheduleController.getById
);

// Buat jadwal
scheduleRouter.post(
  "/",
  requireAuth,
  requireRole("admin", "dispatcher"),
  scheduleController.create
);

// Update jadwal
scheduleRouter.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "dispatcher"),
  scheduleController.update
);

// Hapus jadwal
scheduleRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "dispatcher"),
  scheduleController.remove
);