import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

function envelope(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return envelope(error.status, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    const fields = error.issues.map((issue) => ({
      field: issue.path.join(".") || "(root)",
      message: issue.message,
    }));

    return envelope(
      422,
      "VALIDATION_FAILED",
      "Some fields are invalid. Correct them and try again.",
      { fields },
    );
  }

  console.error(error);

  return envelope(500, "INTERNAL_ERROR", "Something went wrong on our end.");
}
