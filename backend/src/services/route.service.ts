import { prisma } from "../lib/prisma";

class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export class RouteBadRequestError extends HttpError {
  constructor(message: string) { super(400, message); }
}
export class RouteNotFoundError extends HttpError {
  constructor(message: string) { super(404, message); }
}

const priorityScore: Record<string, number> = { high: 3, medium: 2, low: 1 };

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function fallbackOptimize(depot: { lat: number; lng: number }, orders: any[]) {
  const remaining = [...orders];
  const ordered: any[] = [];
  let current = depot;
  let totalDistanceKm = 0;

  while (remaining.length) {
    remaining.sort((a, b) => {
      const da = haversineKm(current, { lat: a.lat, lng: a.lng });
      const db = haversineKm(current, { lat: b.lat, lng: b.lng });
      const priorityBiasA = priorityScore[a.priority] || 0;
      const priorityBiasB = priorityScore[b.priority] || 0;
      return (da - priorityBiasA * 0.35) - (db - priorityBiasB * 0.35);
    });
    const next = remaining.shift()!;
    totalDistanceKm += haversineKm(current, { lat: next.lat, lng: next.lng });
    ordered.push(next);
    current = { lat: next.lat, lng: next.lng };
  }

  if (ordered.length) totalDistanceKm += haversineKm(current, depot);
  const totalDurationMin = Math.max(10, Math.round((totalDistanceKm / 28) * 60 + ordered.length * 10));
  return { orderIds: ordered.map((o) => o.id), totalDistanceKm, totalDurationMin, engine: "fallback" };
}

async function optimizeWithAi(payload: any) {
  const url = process.env.AI_ROUTE_URL || "http://127.0.0.1:8001/optimize-route";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`AI service ${res.status}`);
    return await res.json() as any;
  } catch {
    return null;
  }
}

function startOfDay(dateValue: string | Date) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) throw new RouteBadRequestError("Tanggal route tidak valid");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const routeService = {
  async getOptions() {
    const [vehicles, drivers, orders] = await Promise.all([
      prisma.vehicle.findMany({ where: { status: { not: "maintenance" } }, include: { driver: true }, orderBy: { plateNumber: "asc" } }),
      prisma.user.findMany({ where: { role: "driver", isActive: true }, select: { id: true, name: true, email: true, phone: true } }),
      prisma.order.findMany({
        where: { status: "pending" },
        include: { originWarehouse: true },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      }),
    ]);
    return { vehicles, drivers, orders };
  },

  async listRoutes() {
    return prisma.route.findMany({
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, email: true, phone: true } },
        stops: { include: { order: { include: { originWarehouse: true } } }, orderBy: { sequenceNo: "asc" } },
      },
      orderBy: [{ routeDate: "desc" }, { createdAt: "desc" }],
    });
  },

  async getRoute(id: string) {
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, email: true, phone: true } },
        stops: { include: { order: { include: { originWarehouse: true } } }, orderBy: { sequenceNo: "asc" } },
      },
    });
    if (!route) throw new RouteNotFoundError("Route tidak ditemukan");
    return route;
  },

  async generate(input: { vehicleId: string; driverId: string; routeDate: string; orderIds: string[] }, userId: string) {
    if (!input.orderIds.length) throw new RouteBadRequestError("Pilih minimal satu order");
    if (input.orderIds.length > 50) throw new RouteBadRequestError("Maksimal 50 stop per optimasi");

    const [vehicle, driver, orders] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: input.vehicleId } }),
      prisma.user.findUnique({ where: { id: input.driverId } }),
      prisma.order.findMany({ where: { id: { in: input.orderIds } }, include: { originWarehouse: true } }),
    ]);

    if (!vehicle) throw new RouteNotFoundError("Kendaraan tidak ditemukan");
    if (vehicle.status === "maintenance") throw new RouteBadRequestError("Kendaraan sedang maintenance");
    if (!driver || driver.role !== "driver" || !driver.isActive) throw new RouteBadRequestError("Driver tidak valid/aktif");
    if (orders.length !== input.orderIds.length) throw new RouteBadRequestError("Ada order yang tidak ditemukan");
    if (orders.some((o) => o.status !== "pending")) throw new RouteBadRequestError("Semua order harus berstatus pending");

    const warehouseIds = new Set(orders.map((o) => o.originWarehouseId));
    if (warehouseIds.size !== 1) throw new RouteBadRequestError("Satu route MVP hanya dapat berisi order dari warehouse yang sama");
    const warehouse = orders[0].originWarehouse;
    if (warehouse.latitude == null || warehouse.longitude == null) {
      throw new RouteBadRequestError("Warehouse belum memiliki latitude/longitude");
    }

    const totalWeightKg = orders.reduce((sum, o: any) => sum + Number(o.weightKg ?? 1), 0);
    const capacityKg = Number(vehicle.capacityKg);
    if (totalWeightKg > capacityKg) {
      throw new RouteBadRequestError(`Total muatan ${totalWeightKg.toFixed(1)} kg melebihi kapasitas ${capacityKg.toFixed(1)} kg`);
    }

    const depot = { lat: Number(warehouse.latitude), lng: Number(warehouse.longitude) };
    const normalized = orders.map((o: any) => ({
      id: o.id,
      lat: Number(o.destinationLat),
      lng: Number(o.destinationLng),
      priority: o.priority,
      weightKg: Number(o.weightKg ?? 1),
    }));

    const ai = await optimizeWithAi({ depot, vehicleCapacityKg: capacityKg, orders: normalized });
    const optimized = ai && Array.isArray(ai.orderIds)
      ? { orderIds: ai.orderIds, totalDistanceKm: Number(ai.totalDistanceKm), totalDurationMin: Number(ai.totalDurationMin), engine: ai.engine || "ortools" }
      : fallbackOptimize(depot, normalized);

    const byId = new Map(orders.map((o) => [o.id, o]));
    let elapsed = 0;
    let current = depot;
    const routeDate = startOfDay(input.routeDate);
    routeDate.setUTCHours(8, 0, 0, 0);
    const stopData = optimized.orderIds.map((id: string, index: number) => {
      const order = byId.get(id)!;
      const dest = { lat: Number(order.destinationLat), lng: Number(order.destinationLng) };
      const legKm = haversineKm(current, dest);
      elapsed += Math.round((legKm / 28) * 60) + (index === 0 ? 0 : 10);
      current = dest;
      return { orderId: id, sequenceNo: index + 1, eta: new Date(routeDate.getTime() + elapsed * 60000) };
    });

    const route = await prisma.$transaction(async (tx) => {
      const created = await tx.route.create({
        data: {
          vehicleId: vehicle.id,
          driverId: driver.id,
          routeDate: startOfDay(input.routeDate),
          totalDistanceKm: optimized.totalDistanceKm,
          totalDurationMin: optimized.totalDurationMin,
          optimizedByAi: optimized.engine === "ortools",
          stops: { create: stopData },
        },
        include: {
          vehicle: true,
          driver: { select: { id: true, name: true, email: true, phone: true } },
          stops: { include: { order: { include: { originWarehouse: true } } }, orderBy: { sequenceNo: "asc" } },
        },
      });
      await tx.order.updateMany({ where: { id: { in: optimized.orderIds } }, data: { status: "scheduled" } });
      await tx.activityLog.create({ data: { userId, actionType: "route_generated", referenceId: created.id, referenceType: "route" } });
      await tx.notification.create({ data: { userId: driver.id, type: "route_assigned", referenceId: created.id, message: `Route baru ditugaskan untuk ${input.routeDate}` } });
      return created;
    });
    return { ...route, optimizationEngine: optimized.engine };
  },

  async reoptimize(routeId: string, userId: string) {
    const route = await this.getRoute(routeId);
    if (route.status === "completed") throw new RouteBadRequestError("Route yang sudah completed tidak dapat dioptimasi ulang");
    const pending = route.stops.filter((s) => s.status === "pending");
    if (!pending.length) throw new RouteBadRequestError("Tidak ada stop pending untuk dioptimasi ulang");

    const warehouse = pending[0].order.originWarehouse;
    if (warehouse.latitude == null || warehouse.longitude == null) throw new RouteBadRequestError("Warehouse belum memiliki koordinat");
    const depot = { lat: Number(warehouse.latitude), lng: Number(warehouse.longitude) };
    const normalized = pending.map((s: any) => ({ id: s.order.id, lat: Number(s.order.destinationLat), lng: Number(s.order.destinationLng), priority: s.order.priority, weightKg: Number(s.order.weightKg ?? 1) }));
    const capacityKg = Number(route.vehicle.capacityKg);
    const ai = await optimizeWithAi({ depot, vehicleCapacityKg: capacityKg, orders: normalized });
    const optimized = ai && Array.isArray(ai.orderIds) ? ai : fallbackOptimize(depot, normalized);
    const orderRank = new Map<string, number>(optimized.orderIds.map((id: string, i: number) => [id, i + 1]));

    await prisma.$transaction(async (tx) => {
      for (const stop of pending) {
        await tx.routeStop.update({ where: { id: stop.id }, data: { sequenceNo: orderRank.get(stop.orderId)! } });
      }
      await tx.route.update({ where: { id: routeId }, data: { totalDistanceKm: Number(optimized.totalDistanceKm), totalDurationMin: Number(optimized.totalDurationMin), optimizedByAi: optimized.engine === "ortools" } });
      await tx.activityLog.create({ data: { userId, actionType: "route_generated", referenceId: routeId, referenceType: "route" } });
    });
    return this.getRoute(routeId);
  },

  async updateStopStatus(routeId: string, stopId: string, status: "pending" | "arrived" | "skipped", userId: string) {
    const stop = await prisma.routeStop.findFirst({ where: { id: stopId, routeId }, include: { order: true } });
    if (!stop) throw new RouteNotFoundError("Route stop tidak ditemukan");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.routeStop.update({ where: { id: stopId }, data: { status, actualArrival: status === "arrived" ? new Date() : null } });
      if (status === "arrived") {
        await tx.order.update({ where: { id: stop.orderId }, data: { status: "delivered" } });
        await tx.notification.create({ data: { userId, type: "order_delivered", referenceId: stop.orderId, message: `Order ${stop.order.customerName} delivered` } });
      }
      if (status === "skipped") await tx.order.update({ where: { id: stop.orderId }, data: { status: "pending" } });
      await tx.activityLog.create({ data: { userId, actionType: "order_status_changed", referenceId: stop.orderId, referenceType: "order" } });
      return updated;
    });
  },

  async updateRouteStatus(routeId: string, status: "planned" | "active" | "completed") {
    const route = await prisma.route.findUnique({ where: { id: routeId }, include: { stops: true } });
    if (!route) throw new RouteNotFoundError("Route tidak ditemukan");
    if (status === "completed" && route.stops.some((s) => s.status === "pending")) throw new RouteBadRequestError("Selesaikan atau skip semua stop terlebih dahulu");
    return prisma.$transaction(async (tx) => {
      const updated = await tx.route.update({ where: { id: routeId }, data: { status } });
      await tx.vehicle.update({ where: { id: route.vehicleId }, data: { status: status === "active" ? "on_route" : "available" } });
      if (status === "active") await tx.order.updateMany({ where: { routeStops: { some: { routeId } }, status: "scheduled" }, data: { status: "in_transit" } });
      return updated;
    });
  },
};
