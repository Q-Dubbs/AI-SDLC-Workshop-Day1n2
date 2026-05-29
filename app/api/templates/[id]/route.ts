import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(_: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  return NextResponse.json({ message: "TODO: update template", id, userId: session.userId }, { status: 501 });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  return NextResponse.json({ message: "TODO: delete template", id, userId: session.userId }, { status: 501 });
}