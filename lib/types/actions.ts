/**
 * Shared Action Result Types
 * Discriminated union for type-safe action responses
 */

import { ZodIssue } from "zod";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code:
        | "VALIDATION_ERROR"
        | "NOT_FOUND"
        | "UNAUTHORIZED"
        | "CONFLICT"
        | "UNKNOWN";
      message: string;
      issues?: ZodIssue[];
    };
