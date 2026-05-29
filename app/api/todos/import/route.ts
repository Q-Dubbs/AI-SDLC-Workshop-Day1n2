import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ message: "TODO: import todos", userId: session.userId }, { status: 501 });
}