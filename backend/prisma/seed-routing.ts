import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const routingPassword = process.env.SEED_ROUTING_PASSWORD;
  if (!routingPassword || routingPassword.trim() === "") {
    throw new Error(
      "SEED_ROUTING_PASSWORD is required to seed the routing driver."
    );
  }

  console.log("Seeding routing demo data...");

  // =========================
  // DRIVER
  // =========================

  const passwordHash = await bcrypt.hash(routingPassword, 10);
  const driver = await prisma.user.upsert({
    where: { email: "driver@opsera.id" },
    update: { passwordHash },
    create: {
      name: "Budi Santoso",
      email: "driver@opsera.id",
      passwordHash,
      role: "driver",
      isActive: true,
    },
  });
  // =========================
  // VEHICLE
  // =========================
  let vehicle = await prisma.vehicle.findFirst({
    where: {
      plateNumber: "B 9123 OPS",
    },
  });

  if (!vehicle) {
vehicle = await prisma.vehicle.create({
  data: {
    plateNumber: "B 9123 OPS",
    type: "truck",
    capacityKg: 1200,
    status: "available",
  },
});
  }

  // =========================
  // ORDERS
  // =========================

const warehouses = await prisma.warehouse.findMany({
  orderBy: {
    createdAt: "asc",
  },
});

if (warehouses.length === 0) {
  throw new Error(
    "Warehouse belum tersedia. Jalankan seed warehouse terlebih dahulu."
  );
}

const originWarehouse = warehouses[0];

const orders = [
  {
    customerName: "PT Sejahtera Abadi",
    destinationAddress: "Jl. Sudirman No. 25, Jakarta Pusat",
    destinationLat: -6.2088,
    destinationLng: 106.8456,
    priority: "high",
    weightKg: 180,
  },
  {
    customerName: "CV Maju Bersama",
    destinationAddress: "Jl. Gatot Subroto No. 88, Jakarta Selatan",
    destinationLat: -6.2297,
    destinationLng: 106.8253,
    priority: "medium",
    weightKg: 220,
  },
  {
    customerName: "Toko Berkah Jaya",
    destinationAddress: "Jl. Tebet Raya No. 41, Jakarta Selatan",
    destinationLat: -6.2294,
    destinationLng: 106.8569,
    priority: "medium",
    weightKg: 125,
  },
  {
    customerName: "PT Nusantara Digital",
    destinationAddress: "Jl. Kuningan Persada No. 10, Jakarta Selatan",
    destinationLat: -6.2185,
    destinationLng: 106.8307,
    priority: "high",
    weightKg: 260,
  },
  {
    customerName: "UD Sentosa",
    destinationAddress: "Jl. Palmerah Barat No. 52, Jakarta Barat",
    destinationLat: -6.1978,
    destinationLng: 106.7979,
    priority: "low",
    weightKg: 95,
  },
];

for (const item of orders) {
  const existing = await prisma.order.findFirst({
    where: {
      customerName: item.customerName,
      destinationAddress: item.destinationAddress,
      originWarehouseId: originWarehouse.id,
    },
  });

  if (!existing) {
    await prisma.order.create({
      data: {
        customerName: item.customerName,
        originWarehouseId: originWarehouse.id,
        destinationAddress: item.destinationAddress,
        destinationLat: item.destinationLat,
        destinationLng: item.destinationLng,
        priority: item.priority as any,
        weightKg: item.weightKg,
        status: "pending",
      },
    });
  }
}

  console.log("Routing seed selesai.");
  console.log("Driver:", driver.email);
  console.log("Vehicle:", vehicle.plateNumber);
}

main()
  .catch((error) => {
    console.error("Routing seed gagal:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
