import {
  ScheduleStatus,
  ScheduleType,
} from "@prisma/client";

import { scheduleRepository } from "../repositories/schedule.repository";
import { prisma } from "../lib/prisma";

class ScheduleNotFoundError extends Error {
  status = 404;
}

class ScheduleConflictError extends Error {
  status = 409;

  conflict: any;

  constructor(message: string, conflict: any) {
    super(message);
    this.conflict = conflict;
  }
}

class ScheduleValidationError extends Error {
  status = 400;
}

export const scheduleService = {
  async createSchedule(input: {
    title: string;
    type: ScheduleType;
    assignedTo: string;
    startTime: Date;
    endTime: Date;
    relatedOrderId?: string;
  }) {
    if (input.endTime <= input.startTime) {
      throw new ScheduleValidationError(
        "Waktu selesai harus setelah waktu mulai"
      );
    }

    const assignee = await prisma.user.findUnique({
      where: {
        id: input.assignedTo,
      },
    });

    if (!assignee) {
      throw new ScheduleNotFoundError(
        "Penanggung jawab tidak ditemukan"
      );
    }

    if (!assignee.isActive) {
      throw new ScheduleValidationError(
        "Penanggung jawab sedang tidak aktif"
      );
    }

    const conflict = await scheduleRepository.findConflict(
      input.assignedTo,
      input.startTime,
      input.endTime
    );

    if (conflict) {
      throw new ScheduleConflictError(
        `Jadwal bentrok dengan "${conflict.title}"`,
        conflict
      );
    }

    return scheduleRepository.create(input);
  },

  listSchedules(filters?: {
    type?: ScheduleType;
    status?: ScheduleStatus;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return scheduleRepository.findAll(filters);
  },

  async getSchedule(id: string) {
    const schedule = await scheduleRepository.findById(id);

    if (!schedule) {
      throw new ScheduleNotFoundError(
        "Jadwal tidak ditemukan"
      );
    }

    return schedule;
  },

  async updateSchedule(
    id: string,
    input: {
      title?: string;
      type?: ScheduleType;
      assignedTo?: string;
      startTime?: Date;
      endTime?: Date;
      status?: ScheduleStatus;
      relatedOrderId?: string | null;
    }
  ) {
    const current = await scheduleRepository.findById(id);

    if (!current) {
      throw new ScheduleNotFoundError(
        "Jadwal tidak ditemukan"
      );
    }

    const assignedTo =
      input.assignedTo ?? current.assignedTo;

    const startTime =
      input.startTime ?? current.startTime;

    const endTime =
      input.endTime ?? current.endTime;

    if (endTime <= startTime) {
      throw new ScheduleValidationError(
        "Waktu selesai harus setelah waktu mulai"
      );
    }

    const conflict =
      await scheduleRepository.findConflict(
        assignedTo,
        startTime,
        endTime,
        id
      );

    if (conflict) {
      throw new ScheduleConflictError(
        `Jadwal bentrok dengan "${conflict.title}"`,
        conflict
      );
    }

    return scheduleRepository.update(id, input);
  },

  async deleteSchedule(id: string) {
    const schedule = await scheduleRepository.findById(id);

    if (!schedule) {
      throw new ScheduleNotFoundError(
        "Jadwal tidak ditemukan"
      );
    }

    await scheduleRepository.delete(id);

    return schedule;
  },

  async getCalendar(
    startDate?: Date,
    endDate?: Date
  ) {
    return scheduleRepository.findAll({
      startDate,
      endDate,
    });
  },

  async recommendSlot(input: {
  assignedTo: string;
  date: Date;
  durationMinutes: number;
}) {
  const assignee =
    await prisma.user.findUnique({
      where: {
        id: input.assignedTo,
      },
    });

  if (!assignee) {
    throw new ScheduleNotFoundError(
      "Penanggung jawab tidak ditemukan"
    );
  }

  /*
   * Jam operasional:
   * 08:00 - 18:00
   */
  const startOfDay =
    new Date(input.date);

  startOfDay.setHours(
    8,
    0,
    0,
    0
  );

  const endOfDay =
    new Date(input.date);

  endOfDay.setHours(
    18,
    0,
    0,
    0
  );

  /*
   * Ambil semua schedule aktif
   * milik assignee pada hari itu.
   */
  const schedules =
    await prisma.schedule.findMany({
      where: {
        assignedTo:
          input.assignedTo,

        status: {
          not: "cancelled",
        },

        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },

      orderBy: {
        startTime: "asc",
      },
    });

  let candidateStart =
    new Date(startOfDay);

  /*
   * Cari gap di antara schedule.
   */
  for (const schedule of schedules) {
    const candidateEnd =
      new Date(
        candidateStart.getTime() +
          input.durationMinutes *
            60 *
            1000
      );

    /*
     * Kalau candidate selesai
     * sebelum schedule berikutnya,
     * berarti slot tersedia.
     */
    if (
      candidateEnd <=
      schedule.startTime
    ) {
      return {
        assignedTo:
          input.assignedTo,

        assigneeName:
          assignee.name,

        startTime:
          candidateStart,

        endTime:
          candidateEnd,

        durationMinutes:
          input.durationMinutes,

        workload:
          schedules.length,

        reason:
          "Slot tersedia tanpa bentrok dengan jadwal saat ini.",
      };
    }

    /*
     * Kalau bentrok, geser kandidat
     * ke akhir schedule tersebut.
     */
    if (
      schedule.endTime >
      candidateStart
    ) {
      candidateStart =
        new Date(
          schedule.endTime
        );
    }
  }

  /*
   * Setelah schedule terakhir,
   * cek apakah masih muat sebelum 18:00.
   */
  const candidateEnd =
    new Date(
      candidateStart.getTime() +
        input.durationMinutes *
          60 *
          1000
    );

  if (
    candidateEnd <=
    endOfDay
  ) {
    return {
      assignedTo:
        input.assignedTo,

      assigneeName:
        assignee.name,

      startTime:
        candidateStart,

      endTime:
        candidateEnd,

      durationMinutes:
        input.durationMinutes,

      workload:
        schedules.length,

      reason:
        "Slot tersedia setelah jadwal terakhir pada hari tersebut.",
    };
  }

  return null;
},

async recommendBestSlot(input: {
  date: Date;
  durationMinutes: number;
}) {
  /*
   * Ambil semua driver aktif.
   */
  const drivers = await prisma.user.findMany({
    where: {
      role: "driver",
      isActive: true,
    },

    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (drivers.length === 0) {
    throw new ScheduleNotFoundError(
      "Tidak ada driver aktif yang tersedia"
    );
  }

  /*
   * Jam operasional:
   * 08:00 - 18:00
   */
  const startOfDay = new Date(input.date);

  startOfDay.setHours(
    8,
    0,
    0,
    0
  );

  const endOfDay = new Date(input.date);

  endOfDay.setHours(
    18,
    0,
    0,
    0
  );

  const recommendations = [];

  /*
   * Evaluasi setiap driver.
   */
  for (const driver of drivers) {
    const schedules =
      await prisma.schedule.findMany({
        where: {
          assignedTo: driver.id,

          status: {
            not: "cancelled",
          },

          startTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },

        orderBy: {
          startTime: "asc",
        },
      });

    /*
     * Hitung total workload.
     */
    let workloadMinutes = 0;

    for (const schedule of schedules) {
      const duration =
        schedule.endTime.getTime() -
        schedule.startTime.getTime();

      workloadMinutes +=
        duration / 1000 / 60;
    }

    /*
     * Cari slot pertama yang tersedia.
     */
    let candidateStart =
      new Date(startOfDay);

    let foundSlot = null;

    for (const schedule of schedules) {
      const candidateEnd =
        new Date(
          candidateStart.getTime() +
            input.durationMinutes *
              60 *
              1000
        );

      if (
        candidateEnd <=
        schedule.startTime
      ) {
        foundSlot = {
          startTime:
            candidateStart,

          endTime:
            candidateEnd,
        };

        break;
      }

      if (
        schedule.endTime >
        candidateStart
      ) {
        candidateStart =
          new Date(
            schedule.endTime
          );
      }
    }

    /*
     * Kalau belum ketemu,
     * cek slot setelah schedule terakhir.
     */
    if (!foundSlot) {
      const candidateEnd =
        new Date(
          candidateStart.getTime() +
            input.durationMinutes *
              60 *
              1000
        );

      if (
        candidateEnd <=
        endOfDay
      ) {
        foundSlot = {
          startTime:
            candidateStart,

          endTime:
            candidateEnd,
        };
      }
    }

    /*
     * Driver tidak punya slot.
     */
    if (!foundSlot) {
      continue;
    }

    /*
     * Scoring sederhana.
     *
     * Semakin sedikit workload,
     * semakin tinggi score.
     */
    const workloadScore =
      Math.max(
        0,
        100 -
          workloadMinutes / 5
      );

    /*
     * Semakin awal slot tersedia,
     * semakin tinggi availability score.
     */
    const minutesFromStart =
      (foundSlot.startTime.getTime() -
        startOfDay.getTime()) /
      1000 /
      60;

    const availabilityScore =
      Math.max(
        0,
        100 -
          minutesFromStart / 6
      );

    /*
     * Weighted score.
     */
    const finalScore =
      workloadScore * 0.6 +
      availabilityScore * 0.4;

    recommendations.push({
      assignedTo: driver.id,

      assigneeName:
        driver.name,

      startTime:
        foundSlot.startTime,

      endTime:
        foundSlot.endTime,

      durationMinutes:
        input.durationMinutes,

      taskCount:
        schedules.length,

      workloadMinutes:
        Math.round(
          workloadMinutes
        ),

      score:
        Math.round(
          finalScore
        ),

      reason:
        `Driver memiliki ${schedules.length} task dengan workload ${Math.round(
          workloadMinutes
        )} menit dan slot tersedia tanpa konflik.`,
    });
  }

  if (
    recommendations.length === 0
  ) {
    return null;
  }

  /*
   * Score terbesar = recommendation terbaik.
   */
  recommendations.sort(
    (a, b) =>
      b.score - a.score
  );

  return {
    best:
      recommendations[0],

    alternatives:
      recommendations.slice(
        1,
        4
      ),
  };
},

};

export {
  ScheduleNotFoundError,
  ScheduleConflictError,
  ScheduleValidationError,
};