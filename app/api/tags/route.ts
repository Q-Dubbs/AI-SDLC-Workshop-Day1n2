import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ message: "TODO: list tags", userId: session.userId }, { status: 501 });
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ message: "TODO: create tag", userId: session.userId }, { status: 501 });
}