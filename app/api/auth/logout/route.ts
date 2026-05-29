import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "TODO: clear session" }, { status: 501 });
}