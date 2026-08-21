import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { routeService } from "../services/route.service";

const generateSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  routeDate: z.string().min(8),
  orderIds: z.array(z.string().uuid()).min(1).max(50),
});
const stopStatusSchema = z.object({ status: z.enum(["pending", "arrived", "skipped"]) });
const routeStatusSchema = z.object({ status: z.enum(["planned", "active", "completed"]) });

export const routeController = {
  async options(_req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: await routeService.getOptions() }); } catch (e) { next(e); } },
  async list(_req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: await routeService.listRoutes() }); } catch (e) { next(e); } },
  async detail(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: await routeService.getRoute(req.params.id) }); } catch (e) { next(e); } },
  async generate(req: AuthRequest, res: Response, next: NextFunction) { try { const input = generateSchema.parse(req.body); res.status(201).json({ success: true, data: await routeService.generate(input, req.user!.id), message: "Route berhasil dioptimasi" }); } catch (e) { next(e); } },
  async reoptimize(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: await routeService.reoptimize(req.params.id, req.user!.id), message: "Route berhasil dioptimasi ulang" }); } catch (e) { next(e); } },
  async updateStop(req: AuthRequest, res: Response, next: NextFunction) { try { const { status } = stopStatusSchema.parse(req.body); res.json({ success: true, data: await routeService.updateStopStatus(req.params.id, req.params.stopId, status, req.user!.id) }); } catch (e) { next(e); } },
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) { try { const { status } = routeStatusSchema.parse(req.body); res.json({ success: true, data: await routeService.updateRouteStatus(req.params.id, status) }); } catch (e) { next(e); } },
};
