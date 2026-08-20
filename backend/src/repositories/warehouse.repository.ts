import { prisma } from "../lib/prisma";

export const warehouseRepository = {
  findAll() {
    return prisma.warehouse.findMany({ orderBy: { name: "asc" } });
  },

  findById(id: string) {
    return prisma.warehouse.findUnique({ where: { id } });
  },

  create(data: { name: string; address: string; latitude?: number; longitude?: number }) {
    return prisma.warehouse.create({ data });
  },
};

export const productRepository = {
  findByWarehouse(warehouseId: string) {
    return prisma.product.findMany({
      where: { warehouseId },
      orderBy: { name: "asc" },
    });
  },

  findLowStock() {
    // Prisma belum bisa compare dua kolom langsung (quantity <= reorderPoint)
    // lewat query builder, jadi kita filter manual di JS setelah ambil semua.
    // Untuk skala kecil-menengah (SRD: hingga 10 gudang) ini masih aman;
    // kalau datanya sudah besar, ganti pakai raw SQL ($queryRaw).
    return prisma.product.findMany({
      include: { warehouse: { select: { name: true } } },
    });
  },

  findById(id: string) {
    return prisma.product.findUnique({ include: { warehouse: true }, where: { id } });
  },

  create(data: {
    warehouseId: string;
    sku: string;
    name: string;
    category?: string;
    unit: string;
    quantity?: number;
    reorderPoint?: number;
    unitPrice?: number;
  }) {
    return prisma.product.create({ data });
  },

  updateQuantity(id: string, quantity: number) {
    return prisma.product.update({ where: { id }, data: { quantity } });
  },

  createMovement(data: {
    productId: string;
    type: "in" | "out" | "adjustment";
    quantity: number;
    note?: string;
    createdBy?: string;
  }) {
    return prisma.stockMovement.create({ data });
  },

  findMovements(productId: string) {
    return prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
  },

  findMovementHistory(productId: string) {
  return prisma.stockMovement.findMany({
    where: {
      productId,
      type: "out",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  },
};
