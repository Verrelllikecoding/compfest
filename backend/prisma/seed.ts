import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function getOrCreateWarehouse(
  name: string,
  address: string
) {
  const existing =
    await prisma.warehouse.findFirst({
      where: {
        name,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.warehouse.create({
    data: {
      name,
      address,
    },
  });
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.trim() === "") {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required to seed the admin user."
    );
  }

  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@opsera.id" },
    update: { passwordHash },
    create: {
      name: "Admin User",
      email: "admin@opsera.id",
      passwordHash,
      role: "admin",
    },
  });

  // =========================
  // WAREHOUSES
  // Harus sesuai encoding AI
  // =========================

const warehouse1 =
  await getOrCreateWarehouse(
    "WH-01",
    "Jl. Industri Raya No.10, Jakarta"
  );

const warehouse2 =
  await getOrCreateWarehouse(
    "WH-02",
    "Jl. Gatot Subroto No.88, Jakarta"
  );

const warehouse3 =
  await getOrCreateWarehouse(
    "WH-03",
    "Jl. Ahmad Yani No.120, Jakarta"
  );

const warehouse4 =
  await getOrCreateWarehouse(
    "WH-04",
    "Jl. Sudirman No.50, Jakarta"
  );

  // =========================
  // PRODUCTS
  // SKU dan category disesuaikan AI
  // =========================

  const products = [
    {
      warehouseId: warehouse1.id,
      sku: "SKU-0001",
      name: "Laptop Stand",
      category: "fast_moving",
      unit: "pcs",
      quantity: 120,
      reorderPoint: 30,
      unitPrice: 200000,
    },

    {
      warehouseId: warehouse1.id,
      sku: "SKU-0002",
      name: "Wireless Headset",
      category: "fast_moving",
      unit: "pcs",
      quantity: 45,
      reorderPoint: 30,
      unitPrice: 700000,
    },

    {
      warehouseId: warehouse2.id,
      sku: "SKU-0003",
      name: "Office Chair",
      category: "medium_moving",
      unit: "pcs",
      quantity: 12,
      reorderPoint: 20,
      unitPrice: 1500000,
    },

    {
      warehouseId: warehouse1.id,
      sku: "SKU-0004",
      name: "Wireless Mouse",
      category: "fast_moving",
      unit: "pcs",
      quantity: 8,
      reorderPoint: 15,
      unitPrice: 600000,
    },

    {
      warehouseId: warehouse3.id,
      sku: "SKU-0005",
      name: "Mechanical Keyboard",
      category: "medium_moving",
      unit: "pcs",
      quantity: 20,
      reorderPoint: 10,
      unitPrice: 850000,
    },

    {
      warehouseId: warehouse2.id,
      sku: "SKU-0006",
      name: '24" Monitor',
      category: "medium_moving",
      unit: "pcs",
      quantity: 28,
      reorderPoint: 15,
      unitPrice: 1500000,
    },

    {
      warehouseId: warehouse3.id,
      sku: "SKU-0007",
      name: "Standing Desk",
      category: "slow_moving",
      unit: "pcs",
      quantity: 10,
      reorderPoint: 10,
      unitPrice: 2160000,
    },

    {
      warehouseId: warehouse4.id,
      sku: "SKU-0008",
      name: "HD Webcam",
      category: "fast_moving",
      unit: "pcs",
      quantity: 32,
      reorderPoint: 10,
      unitPrice: 500000,
    },
  ];

  // =========================
  // CREATE PRODUCT + HISTORY
  // =========================

  for (let productIndex = 0; productIndex < products.length; productIndex++) {
    const p = products[productIndex];

const existingProduct =
  await prisma.product.findUnique({
    where: {
      sku: p.sku,
    },
  });

const product =
  existingProduct ??
  (await prisma.product.create({
    data: p,
  }));

    // Movement stok awal
const initialMovement =
  await prisma.stockMovement.findFirst({
    where: {
      productId: product.id,
      note: "Initial stock",
    },
  });

if (!initialMovement) {
  await prisma.stockMovement.create({
    data: {
      productId: product.id,
      type: "in",
      quantity: p.quantity,
      note: "Initial stock",
      createdBy: admin.id,
    },
  });
}

    // =========================
    // 45 DAYS HISTORICAL DEMAND
    // =========================

  const historicalMovementCount =
  await prisma.stockMovement.count({
    where: {
      productId: product.id,
      note: "Historical demand seed",
    },
  });

if (historicalMovementCount === 0) {
  for (let day = 45; day >= 1; day--) {
    const movementDate = new Date();

    movementDate.setDate(
      movementDate.getDate() - day
    );

    let baseDemand = 5;

    if (p.category === "fast_moving") {
      baseDemand = 50;
    }

    if (p.category === "medium_moving") {
      baseDemand = 20;
    }

    if (p.category === "slow_moving") {
      baseDemand = 5;
    }

    const variation =
      Math.floor(Math.random() * 11) - 5;

    const quantity = Math.max(
      0,
      baseDemand + variation
    );

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "out",
        quantity,
        note: "Historical demand seed",
        createdBy: admin.id,
        createdAt: movementDate,
      },
    });
  }
}

  }

  console.log("Seed selesai.");
  console.log("Admin user: admin@opsera.id");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
