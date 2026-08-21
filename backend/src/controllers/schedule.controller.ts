import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { scheduleService } from "../services/schedule.service";

const createScheduleSchema = z
  .object({
    title: z.string().min(2, "Judul minimal 2 karakter"),

    type: z.enum([
      "pickup",
      "delivery",
      "maintenance",
      "other",
    ]),

    assignedTo: z.string().uuid("ID penanggung jawab tidak valid"),

    startTime: z.coerce.date({
      invalid_type_error: "Waktu mulai tidak valid",
    }),

    endTime: z.coerce.date({
      invalid_type_error: "Waktu selesai tidak valid",
    }),

    relatedOrderId: z
      .string()
      .uuid("Order ID tidak valid")
      .optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Waktu selesai harus setelah waktu mulai",
    path: ["endTime"],
  });

const updateScheduleSchema = z.object({
  title: z.string().min(2).optional(),

  type: z
    .enum([
      "pickup",
      "delivery",
      "maintenance",
      "other",
    ])
    .optional(),

  assignedTo: z
    .string()
    .uuid("ID penanggung jawab tidak valid")
    .optional(),

  startTime: z.coerce.date().optional(),

  endTime: z.coerce.date().optional(),

  status: z
    .enum([
      "planned",
      "in_progress",
      "done",
      "cancelled",
    ])
    .optional(),

  relatedOrderId: z
    .string()
    .uuid("Order ID tidak valid")
    .nullable()
    .optional(),
});

const scheduleFilterSchema = z.object({
  type: z
    .enum([
      "pickup",
      "delivery",
      "maintenance",
      "other",
    ])
    .optional(),

  status: z
    .enum([
      "planned",
      "in_progress",
      "done",
      "cancelled",
    ])
    .optional(),

  assignedTo: z.string().uuid().optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),
});

const calendarFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const recommendSlotSchema = z.object({
  assignedTo: z
    .string()
    .uuid("ID penanggung jawab tidak valid"),

  date: z.coerce.date(),

  durationMinutes: z.coerce
    .number()
    .int()
    .min(15)
    .max(600),
});

const recommendBestSlotSchema =
  z.object({
    date: z.coerce.date(),

    durationMinutes: z.coerce
      .number()
      .int()
      .min(15)
      .max(600),
});

export const scheduleController = {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const input = createScheduleSchema.parse(req.body);

      const schedule =
        await scheduleService.createSchedule(input);

      return res.status(201).json({
        success: true,
        data: schedule,
        message: "Jadwal berhasil dibuat",
      });
    } catch (err) {
      next(err);
    }
  },

  async list(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters = scheduleFilterSchema.parse(req.query);

      const schedules =
        await scheduleService.listSchedules(filters);

      return res.json({
        success: true,
        data: schedules,
        message: "Jadwal berhasil diambil",
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const schedule =
        await scheduleService.getSchedule(req.params.id);

      return res.json({
        success: true,
        data: schedule,
        message: "Detail jadwal berhasil diambil",
      });
    } catch (err) {
      next(err);
    }
  },

  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const input = updateScheduleSchema.parse(req.body);

      const schedule =
        await scheduleService.updateSchedule(
          req.params.id,
          input
        );

      return res.json({
        success: true,
        data: schedule,
        message: "Jadwal berhasil diperbarui",
      });
    } catch (err) {
      next(err);
    }
  },

  async remove(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const schedule =
        await scheduleService.deleteSchedule(
          req.params.id
        );

      return res.json({
        success: true,
        data: schedule,
        message: "Jadwal berhasil dihapus",
      });
    } catch (err) {
      next(err);
    }
  },

  async calendar(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { startDate, endDate } =
        calendarFilterSchema.parse(req.query);

      const schedules =
        await scheduleService.getCalendar(
          startDate,
          endDate
        );

      return res.json({
        success: true,
        data: schedules,
        message: "Data kalender berhasil diambil",
      });
    } catch (err) {
      next(err);
    }
  },

  async recommendSlot(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input =
      recommendSlotSchema.parse(
        req.body
      );

    const recommendation =
      await scheduleService.recommendSlot(
        input
      );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        data: null,
        message:
          "Tidak ada slot tersedia pada tanggal tersebut",
      });
    }

    return res.json({
      success: true,
      data: recommendation,
      message:
        "Rekomendasi slot berhasil dibuat",
    });
  } catch (err) {
    next(err);
  }
},

async recommendBestSlot(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input =
      recommendBestSlotSchema.parse(
        req.body
      );

    const result =
      await scheduleService.recommendBestSlot(
        input
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        data: null,
        message:
          "Tidak ada driver dan slot yang tersedia",
      });
    }

    return res.json({
      success: true,

      data: result,

      message:
        "Rekomendasi terbaik berhasil dibuat",
    });
  } catch (err) {
    next(err);
  }
},

};