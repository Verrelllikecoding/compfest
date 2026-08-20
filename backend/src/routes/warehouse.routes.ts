import { Router } from "express";
import { warehouseController } from "../controllers/warehouse.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

export const warehouseRouter = Router();


warehouseRouter.post("/", requireAuth, requireRole("admin"), warehouseController.createWarehouse);
warehouseRouter.get("/", requireAuth, warehouseController.listWarehouses);
warehouseRouter.post(
  "/:id/products",
  requireAuth,
  requireRole("admin", "warehouse_staff"),
  warehouseController.createProduct
);
warehouseRouter.get("/:id/products", requireAuth, warehouseController.listProducts);

export const productRouter = Router();

productRouter.get("/low-stock", requireAuth, warehouseController.listLowStock);
productRouter.get(
  "/:id/forecast",
  requireAuth,
  warehouseController.forecastProduct
);
productRouter.post(
  "/:id/movements",
  requireAuth,
  requireRole("admin", "warehouse_staff"),
  warehouseController.createMovement
);

productRouter.get("/:id/movements", requireAuth, warehouseController.listMovements);
