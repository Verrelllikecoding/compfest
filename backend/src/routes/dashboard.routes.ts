import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from "../lib/prisma";

export const dashboardRouter = Router();

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

dashboardRouter.get("/summary", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [
      totalOrders,
      deliveredOrders,
      activeRoutesCount,
      todaySchedules,
      routes,
      warehouses,
      unreadNotifications,
      activityLogs,
      recentMovements,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "delivered" } }),
      prisma.route.count({ where: { status: "active" } }),
      prisma.schedule.findMany({
        where: {
          startTime: { gte: todayStart, lte: todayEnd },
          status: { not: "cancelled" },
        },
        include: {
          assignee: { select: { id: true, name: true, role: true } },
          order: { select: { id: true, customerName: true, destinationAddress: true } },
        },
        orderBy: { startTime: "asc" },
        take: 6,
      }),
      prisma.route.findMany({
        include: {
          vehicle: true,
          driver: { select: { id: true, name: true } },
          stops: {
            include: {
              order: {
                select: {
                  id: true,
                  customerName: true,
                  destinationAddress: true,
                  destinationLat: true,
                  destinationLng: true,
                  status: true,
                },
              },
            },
            orderBy: { sequenceNo: "asc" },
          },
        },
        orderBy: [{ routeDate: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.warehouse.findMany({
        include: {
          products: {
            select: { id: true, quantity: true, reorderPoint: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.notification.count({
        where: { userId: req.user!.id, isRead: false },
      }),
      prisma.activityLog.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.stockMovement.findMany({
        include: {
          product: { select: { name: true, sku: true } },
          creator: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    const warehouseSummary = warehouses.map((warehouse) => {
      const totalItems = warehouse.products.reduce((sum, product) => sum + product.quantity, 0);
      const productCount = warehouse.products.length;
      const lowStockCount = warehouse.products.filter(
        (product) => product.quantity <= product.reorderPoint
      ).length;
      const healthyCount = Math.max(productCount - lowStockCount, 0);
      const healthPercent = productCount === 0 ? 0 : Math.round((healthyCount / productCount) * 100);

      let status = "Healthy";
      if (productCount === 0) status = "No Products";
      else if (healthPercent < 50) status = "Critical";
      else if (healthPercent < 80) status = "Restock Soon";

      return {
        id: warehouse.id,
        name: warehouse.name,
        address: warehouse.address,
        totalItems,
        productCount,
        lowStockCount,
        healthPercent,
        status,
      };
    });

    const totalItemsMonitored = warehouseSummary.reduce((sum, item) => sum + item.totalItems, 0);
    const lowStockProducts = warehouseSummary.reduce((sum, item) => sum + item.lowStockCount, 0);
    const completionRate = totalOrders === 0 ? 0 : Math.round((deliveredOrders / totalOrders) * 100);

    const normalizedRoutes = routes.map((route) => {
      const completedStops = route.stops.filter((stop) => stop.status === "arrived").length;
      const completion = route.stops.length === 0
        ? route.status === "completed" ? 100 : 0
        : Math.round((completedStops / route.stops.length) * 100);

      return {
        id: route.id,
        label: `${route.vehicle.plateNumber} · ${route.driver.name}`,
        routeDate: route.routeDate,
        status: route.status,
        vehicle: route.vehicle.plateNumber,
        driver: route.driver.name,
        distanceKm: route.totalDistanceKm ? Number(route.totalDistanceKm) : null,
        durationMin: route.totalDurationMin,
        optimizedByAi: route.optimizedByAi,
        completion,
        stopCount: route.stops.length,
        completedStops,
        stops: route.stops.map((stop) => ({
          id: stop.id,
          sequenceNo: stop.sequenceNo,
          status: stop.status,
          eta: stop.eta,
          customerName: stop.order.customerName,
          destinationAddress: stop.order.destinationAddress,
          destinationLat: Number(stop.order.destinationLat),
          destinationLng: Number(stop.order.destinationLng),
          orderStatus: stop.order.status,
        })),
      };
    });

    const combinedActivity = [
      ...activityLogs.map((log) => ({
        id: `log-${log.id}`,
        type: "activity",
        title: log.actionType.replace(/_/g, " "),
        description: `${log.user.name} · ${log.referenceType || "operation"}`,
        createdAt: log.createdAt,
      })),
      ...recentMovements.map((movement) => ({
        id: `movement-${movement.id}`,
        type: "stock_movement",
        title: `${movement.product.name} stock ${movement.type}`,
        description: `${movement.quantity} unit · ${movement.creator?.name || "System"}`,
        createdAt: movement.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6);

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          deliveredOrders,
          completionRate,
          activeRoutes: activeRoutesCount,
          todaySchedules: todaySchedules.length,
          lowStockProducts,
          totalItemsMonitored,
        },
        schedules: todaySchedules,
        routes: normalizedRoutes,
        warehouses: warehouseSummary,
        unreadNotifications,
        activity: combinedActivity,
      },
    });
  } catch (err) {
    next(err);
  }
});
