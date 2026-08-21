import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { routeController } from "../controllers/route.controller";

export const routeRouter = Router();
routeRouter.get("/options", requireAuth, requireRole("admin", "dispatcher"), routeController.options);
routeRouter.get("/", requireAuth, routeController.list);
routeRouter.get("/:id", requireAuth, routeController.detail);
routeRouter.post("/generate", requireAuth, requireRole("admin", "dispatcher"), routeController.generate);
routeRouter.post("/:id/reoptimize", requireAuth, requireRole("admin", "dispatcher"), routeController.reoptimize);
routeRouter.patch("/:id/status", requireAuth, requireRole("admin", "dispatcher", "driver"), routeController.updateStatus);
routeRouter.patch("/:id/stops/:stopId/status", requireAuth, requireRole("admin", "dispatcher", "driver"), routeController.updateStop);
