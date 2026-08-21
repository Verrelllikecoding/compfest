import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const warehouses = await prisma.warehouse.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const grouped = new Map<
    string,
    typeof warehouses
  >();

  for (const warehouse of warehouses) {
    const existing =
      grouped.get(warehouse.name) ?? [];

    existing.push(warehouse);

    grouped.set(
      warehouse.name,
      existing
    );
  }

  for (const [name, duplicates] of grouped) {
    if (duplicates.length <= 1) {
      continue;
    }

    console.log(
      `Duplicate warehouse ditemukan: ${name}`
    );

    // Warehouse pertama/tertua dipertahankan.
    const keep = duplicates[0];

    console.log(
      `Keep ${keep.name}: ${keep.id}`
    );

    for (const warehouse of duplicates.slice(1)) {
      if (warehouse._count.products > 0) {
        console.log(
          `SKIP ${warehouse.id} karena masih memiliki ${warehouse._count.products} produk`
        );

        continue;
      }

      await prisma.warehouse.delete({
        where: {
          id: warehouse.id,
        },
      });

      console.log(
        `Deleted duplicate ${warehouse.name}: ${warehouse.id}`
      );
    }
  }

  console.log(
    "Cleanup duplicate warehouse selesai."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });