import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  return NextResponse.json({ message: "TODO: get todo by id", id, userId: session.userId }, { status: 501 });
}

export async function PUT(_: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  return NextResponse.json({ message: "TODO: update todo", id, userId: session.userId }, { status: 501 });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  return NextResponse.json({ message: "TODO: delete todo", id, userId: session.userId }, { status: 501 });
}