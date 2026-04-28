import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
