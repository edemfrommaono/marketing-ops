import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type ApiError = { error: string; code?: string };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, code } satisfies ApiError, { status });
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

/** Parse and validate request body — returns null + sends 400 on failure */
export async function parseBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function paginate(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}
