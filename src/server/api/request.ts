import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import type { ZodType } from "zod";

import { auth } from "@/lib/auth";

import { ApiError, errorResponse } from "./errors";

export function route<Context>(
  handler: (request: NextRequest, context: Context) => Promise<Response>,
) {
  return async (request: NextRequest, context: Context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }

  return session.user.id;
}

export async function parseBody<T>(request: NextRequest, schema: ZodType<T>) {
  const body = await request.json().catch(() => {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  });

  return schema.parse(body);
}
