import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { warehouseService } from "../services/warehouse.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const createWarehouseSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(4),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const createProductSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  category: z.string().optional(),
  unit: z.string().min(1),
  quantity: z.number().int().nonnegative().default(0),
  reorderPoint: z.number().int().nonnegative().default(0),
  unitPrice: z.number().nonnegative().default(0),
});

const movementSchema = z.object({
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
});

export const warehouseController = {
  async listWarehouses(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await warehouseService.listWarehouses();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createWarehouseSchema.parse(req.body);
      const data = await warehouseService.createWarehouse(input);
      res.status(201).json({ success: true, data, message: "Gudang berhasil dibuat" });
    } catch (err) {
      next(err);
    }
  },

  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await warehouseService.listProducts(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createProductSchema.parse(req.body);
      const data = await warehouseService.createProduct(req.params.id, input);
      res.status(201).json({ success: true, data, message: "Produk berhasil ditambahkan" });
    } catch (err) {
      next(err);
    }
  },

  async listLowStock(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await warehouseService.listLowStock();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createMovement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = movementSchema.parse(req.body);
      const data = await warehouseService.recordMovement(req.params.id, input, req.user!.id);
      res.status(201).json({ success: true, data, message: "Pergerakan stok tercatat" });
    } catch (err) {
      next(err);
    }
  },

  async listMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await warehouseService.listMovements(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  async forecastProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data =
      await warehouseService.forecastProduct(
        req.params.id
      );

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
},
};
