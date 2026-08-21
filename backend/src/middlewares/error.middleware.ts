import {
  Request,
  Response,
  NextFunction,
} from "express";

import { ZodError } from "zod";

import { AuthError } from "../services/auth.service";

import { NotFoundError } from "../services/warehouse.service";

import {
  ScheduleNotFoundError,
  ScheduleConflictError,
  ScheduleValidationError,
} from "../services/schedule.service";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  /*
   * Zod validation error
   */
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message:
        err.errors[0]?.message ||
        "Input tidak valid",
    });
  }

  /*
   * Auth / Warehouse errors
   */
  if (
    err instanceof AuthError ||
    err instanceof NotFoundError
  ) {
    return res
      .status((err as any).status || 400)
      .json({
        success: false,
        message: err.message,
      });
  }

  /*
   * Scheduling - Conflict
   */
  if (
    err instanceof ScheduleConflictError
  ) {
    return res.status(409).json({
      success: false,
      message: err.message,
      data: {
        conflict: err.conflict,
      },
    });
  }

  /*
   * Scheduling - Not Found
   */
  if (
    err instanceof ScheduleNotFoundError
  ) {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }

  /*
   * Scheduling - Validation
   */
  if (
    err instanceof ScheduleValidationError
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  /*
   * Error yang menggunakan statusCode
   *
   * Tetap dipertahankan karena dapat
   * digunakan Route Optimization /
   * AI Service / modul lain.
   */
  if (
    err &&
    typeof err === "object" &&
    "statusCode" in err
  ) {
    const httpError = err as {
      statusCode: number;
      message?: string;
    };

    const status = Number(
      httpError.statusCode
    );

    return res.status(status).json({
      success: false,
      message:
        httpError.message ||
        "Terjadi kesalahan pada server",
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message:
      "Terjadi kesalahan pada server",
  });
}