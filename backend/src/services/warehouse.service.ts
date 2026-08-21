import axios from "axios";
import {
  warehouseRepository,
  productRepository,
} from "../repositories/warehouse.repository";
import { prisma } from "../lib/prisma";

class NotFoundError extends Error {
  status = 404;
}

class BadRequestError extends Error {
  status = 400;
}


export const warehouseService = {
  listWarehouses: () => warehouseRepository.findAll(),

  createWarehouse: (input: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }) => warehouseRepository.create(input),

  async listProducts(warehouseId: string) {
    const warehouse = await warehouseRepository.findById(warehouseId);

    if (!warehouse) {
      throw new NotFoundError("Gudang tidak ditemukan");
    }

    return productRepository.findByWarehouse(warehouseId);
  },

async createProduct(
  warehouseId: string,
  input: {
    sku: string;
    name: string;
    category?: string;
    unit: string;
    quantity?: number;
    reorderPoint?: number;
    unitPrice?: number;
  },
  userId: string
) {
  const warehouse =
    await warehouseRepository.findById(warehouseId);

  if (!warehouse) {
    throw new NotFoundError("Gudang tidak ditemukan");
  }

  const initialQuantity = input.quantity ?? 0;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        warehouseId,
        sku: input.sku,
        name: input.name,
        category: input.category,
        unit: input.unit,
        quantity: initialQuantity,
        reorderPoint: input.reorderPoint ?? 0,
        unitPrice: input.unitPrice ?? 0,
      },
    });

    if (initialQuantity > 0) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "in",
          quantity: initialQuantity,
          note: "Initial stock when product was created",
          createdBy: userId,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          actionType: "stock_movement",
          referenceId: product.id,
          referenceType: "product",
        },
      });
    }

    return product;
  });
},

  async listLowStock() {
    const products = await productRepository.findLowStock();

    return products
      .filter(
        (product: (typeof products)[number]) =>
          product.quantity <= product.reorderPoint
      )
      .map((product: (typeof products)[number]) => ({
        ...product,
        warehouseName: product.warehouse.name,
      }));
  },

  // Catat pergerakan stok sekaligus update quantity produk.
async recordMovement(
  productId: string,
  input: {
    type: "in" | "out" | "adjustment";
    quantity: number;
    note?: string;
  },
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    /* ==========================================
       FIND PRODUCT
    ========================================== */

    const product = await tx.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundError(
        "Produk tidak ditemukan"
      );
    }

    /* ==========================================
       VALIDATE STOCK OUT
    ========================================== */

    if (
      input.type === "out" &&
      input.quantity > product.quantity
    ) {
      throw new BadRequestError(
        `Stok tidak mencukupi. Stok tersedia: ${product.quantity}`
      );
    }

    /* ==========================================
       CALCULATE STOCK
    ========================================== */

    const delta =
      input.type === "out"
        ? -input.quantity
        : input.quantity;

    const newQuantity =
      product.quantity + delta;

    /* ==========================================
       CREATE STOCK MOVEMENT
    ========================================== */

    const movement =
      await tx.stockMovement.create({
        data: {
          productId,

          type: input.type,

          quantity: input.quantity,

          note: input.note,

          createdBy: userId,
        },
      });

    /* ==========================================
       UPDATE PRODUCT QUANTITY
    ========================================== */

    await tx.product.update({
      where: {
        id: productId,
      },

      data: {
        quantity: newQuantity,
      },
    });

    /* ==========================================
       ACTIVITY LOG
    ========================================== */

    await tx.activityLog.create({
      data: {
        userId,

        actionType: "stock_movement",

        referenceId: productId,

        referenceType: "product",
      },
    });

    return {
      movement,
      newQuantity,
    };
  });
},

  listMovements: (productId: string) =>
    productRepository.findMovements(productId),

  // ============================================================
  // AI STOCK FORECAST
  // ============================================================

  async forecastProduct(productId: string) {
    // ----------------------------------------------------------
    // 1. Ambil produk
    // ----------------------------------------------------------

    const product =
      await productRepository.findById(productId);

    if (product === null) {
      throw new NotFoundError(
        "Produk tidak ditemukan"
      );
    }

    // ----------------------------------------------------------
    // 2. Validasi SKU
    // Model AI hanya mengenali SKU-0001 sampai SKU-0200
    // ----------------------------------------------------------

    const skuMatch =
      product.sku.match(/^SKU-(\d{4})$/);

    if (!skuMatch) {
      throw new BadRequestError(
        `Format SKU "${product.sku}" tidak sesuai dengan format AI`
      );
    }

    const skuNumber = Number(skuMatch[1]);

    if (
      skuNumber < 1 ||
      skuNumber > 200
    ) {
      throw new BadRequestError(
        `SKU "${product.sku}" tidak dikenali oleh model AI`
      );
    }

    const product_code =
      skuNumber - 1;

    // ----------------------------------------------------------
    // 3. Encoding kategori
    // ----------------------------------------------------------

    const categoryMap: Record<
      string,
      number
    > = {
      fast_moving: 0,
      medium_moving: 1,
      slow_moving: 2,
    };

    if (!product.category) {
      throw new BadRequestError(
        "Produk belum memiliki kategori"
      );
    }

    const category_code =
      categoryMap[product.category];

    if (category_code === undefined) {
      throw new BadRequestError(
        `Kategori "${product.category}" tidak dikenali oleh model AI`
      );
    }

    // ----------------------------------------------------------
    // 4. Encoding warehouse
    // ----------------------------------------------------------

const warehouseMap: Record<string, number> = {
  "WH-01": 0,
  "WH-02": 1,
  "WH-03": 2,
  "WH-04": 3,
};

const warehouse_code =
  warehouseMap[product.warehouse.name];

if (warehouse_code === undefined) {
  throw new BadRequestError(
    `Warehouse "${product.warehouse.name}" tidak dikenali oleh model AI`
  );
}
    // ----------------------------------------------------------
    // 5. Ambil historical movement tipe OUT
    // ----------------------------------------------------------

    const movements =
      await productRepository.findMovementHistory(
        productId
      );

    if (movements.length === 0) {
      throw new BadRequestError(
        "Belum ada historical stock movement untuk produk ini"
      );
    }

    // ----------------------------------------------------------
    // 6. Kelompokkan demand per tanggal
    // ----------------------------------------------------------

    const demandByDate =
      new Map<string, number>();

    for (const movement of movements) {
      const dateKey =
        movement.createdAt
          .toISOString()
          .slice(0, 10);

      const existing =
        demandByDate.get(dateKey) ?? 0;

      demandByDate.set(
        dateKey,
        existing + movement.quantity
      );
    }

    // ----------------------------------------------------------
    // 7. Tentukan tanggal forecast
    //
    // Kita prediksi hari berikutnya.
    // ----------------------------------------------------------

    const forecastDate = new Date();

    forecastDate.setDate(
      forecastDate.getDate() + 1
    );

    forecastDate.setHours(
      0,
      0,
      0,
      0
    );

    // ----------------------------------------------------------
    // 8. Helper untuk mengambil demand N hari sebelumnya
    // ----------------------------------------------------------

    const getDemandDaysAgo = (
      daysAgo: number
    ) => {
      const date = new Date(
        forecastDate
      );

      date.setDate(
        date.getDate() - daysAgo
      );

      const dateKey =
        date
          .toISOString()
          .slice(0, 10);

      return (
        demandByDate.get(dateKey) ?? 0
      );
    };

    // ----------------------------------------------------------
    // 9. Hitung lag
    // ----------------------------------------------------------

    const lag_1 =
      getDemandDaysAgo(1);

    const lag_7 =
      getDemandDaysAgo(7);

    const lag_14 =
      getDemandDaysAgo(14);

    const lag_30 =
      getDemandDaysAgo(30);

    // ----------------------------------------------------------
    // 10. Helper average
    // ----------------------------------------------------------

    const average = (
      values: number[]
    ) => {
      if (values.length === 0) {
        return 0;
      }

      return (
        values.reduce(
          (total, value) =>
            total + value,
          0
        ) / values.length
      );
    };

    // ----------------------------------------------------------
    // 11. Rolling 7 hari
    // ----------------------------------------------------------

    const last7Days: number[] = [];

    for (
      let dayOffset = 1;
      dayOffset <= 7;
      dayOffset++
    ) {
      last7Days.push(
        getDemandDaysAgo(
          dayOffset
        )
      );
    }

    const rolling_7 =
      average(last7Days);

    // ----------------------------------------------------------
    // 12. Rolling 30 hari
    // ----------------------------------------------------------

    const last30Days: number[] =
      [];

    for (
      let dayOffset = 1;
      dayOffset <= 30;
      dayOffset++
    ) {
      last30Days.push(
        getDemandDaysAgo(
          dayOffset
        )
      );
    }

    const rolling_30 =
      average(last30Days);

    // ----------------------------------------------------------
    // 13. Date features
    // ----------------------------------------------------------

    // Day of year: 1 - 365/366
    const startOfYear =
      new Date(
        forecastDate.getFullYear(),
        0,
        0
      );

    const millisecondsPerDay =
      1000 *
      60 *
      60 *
      24;

    const day = Math.floor(
      (
        forecastDate.getTime() -
        startOfYear.getTime()
      ) / millisecondsPerDay
    );

    // JavaScript:
    // Sunday = 0
    // Monday = 1
    //
    // Kita ubah:
    // Monday = 0
    // Tuesday = 1
    // ...
    // Sunday = 6
    const dow =
      (
        forecastDate.getDay() +
        6
      ) % 7;

    // January = 1
    // ...
    // December = 12
    const month =
      forecastDate.getMonth() + 1;

    // ----------------------------------------------------------
    // 14. Payload ke FastAPI
    // ----------------------------------------------------------

    const aiPayload = {
      day,
      dow,
      month,

      lag_1,
      lag_7,
      lag_14,
      lag_30,

      rolling_7,
      rolling_30,

      category_code,
      product_code,
      warehouse_code,
    };

    // ----------------------------------------------------------
    // 15. Hubungi AI service
    // ----------------------------------------------------------

    const aiServiceUrl =
    process.env.AI_SERVICE_URL ??
    "http://127.0.0.1:8000";

    let predictedDemand: number;

    try {
      const response =
        await axios.post(
          `${aiServiceUrl}/predict`,
          aiPayload,
          {
            timeout: 10000,
          }
        );

      if (
        response.data.error
      ) {
        throw new Error(
          response.data.error
        );
      }

      predictedDemand =
        Number(
          response.data
            .predicted_demand
        );

      if (
        Number.isNaN(
          predictedDemand
        )
      ) {
        throw new Error(
          "AI mengembalikan predicted_demand yang tidak valid"
        );
      }
    } catch (error) {
      console.error(
        "AI SERVICE ERROR:",
        error
      );

      const serviceError =
        new Error(
          "Gagal mendapatkan forecast dari AI service"
        );

      (
        serviceError as Error & {
          status?: number;
        }
      ).status = 503;

      throw serviceError;
    }

    // ----------------------------------------------------------
    // 16. Recommendation
    // ----------------------------------------------------------

    const safetyFactor = 1.2;

    const recommendedStock =
      Math.ceil(
        predictedDemand *
          safetyFactor
      );

    const suggestedRestock =
      Math.max(
        recommendedStock -
          product.quantity,
        0
      );

    let status:
      | "healthy"
      | "restock"
      | "critical" =
      "healthy";

    if (
      product.quantity <
      predictedDemand
    ) {
      status = "restock";
    }

    if (
      product.quantity <=
      product.reorderPoint
    ) {
      status = "critical";
    }

    // ----------------------------------------------------------
    // 17. Response
    // ----------------------------------------------------------

    return {
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category:
          product.category,
        unit: product.unit,
      },

      warehouse: {
        id:
          product.warehouse.id,
        name:
          product.warehouse.name,
      },

      currentStock:
        product.quantity,

      reorderPoint:
        product.reorderPoint,

      forecast: {
        date:
          forecastDate
            .toISOString()
            .slice(0, 10),

        predictedDemand:
          Math.round(
            predictedDemand * 100
          ) / 100,

        recommendedStock,

        suggestedRestock,

        status,
      },

      // Untuk debugging.
      // Nanti kalau production
      // bisa dihapus.
      features: aiPayload,
    };
  },
};

export {
  NotFoundError,
  BadRequestError,
};
