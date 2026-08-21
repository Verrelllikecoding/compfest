import { prisma } from "../lib/prisma";
import { Prisma, ScheduleStatus, ScheduleType } from "@prisma/client";

export const scheduleRepository = {
  create(data: {
    title: string;
    type: ScheduleType;
    assignedTo: string;
    startTime: Date;
    endTime: Date;
    status?: ScheduleStatus;
    relatedOrderId?: string;
  }) {
    return prisma.schedule.create({
      data,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        order: true,
      },
    });
  },

  findAll(filters?: {
    type?: ScheduleType;
    status?: ScheduleStatus;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.ScheduleWhereInput = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};

      if (filters.startDate) {
        where.startTime.gte = filters.startDate;
      }

      if (filters.endDate) {
        where.startTime.lte = filters.endDate;
      }
    }

    return prisma.schedule.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        order: {
          select: {
            id: true,
            customerName: true,
            destinationAddress: true,
            priority: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });
  },

  findById(id: string) {
    return prisma.schedule.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        order: true,
      },
    });
  },

  findConflict(
    assignedTo: string,
    startTime: Date,
    endTime: Date,
    excludeScheduleId?: string
  ) {
    return prisma.schedule.findFirst({
      where: {
        assignedTo,

        status: {
          not: "cancelled",
        },

        ...(excludeScheduleId
          ? {
              id: {
                not: excludeScheduleId,
              },
            }
          : {}),

        startTime: {
          lt: endTime,
        },

        endTime: {
          gt: startTime,
        },
      },

      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  update(
    id: string,
    data: {
      title?: string;
      type?: ScheduleType;
      assignedTo?: string;
      startTime?: Date;
      endTime?: Date;
      status?: ScheduleStatus;
      relatedOrderId?: string | null;
    }
  ) {
    return prisma.schedule.update({
      where: { id },
      data,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        order: true,
      },
    });
  },

  delete(id: string) {
    return prisma.schedule.delete({
      where: { id },
    });
  },
};