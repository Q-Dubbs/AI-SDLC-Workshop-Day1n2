import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  return NextResponse.json({ message: "TODO: assign tags to todo", todoId: id, userId: session.userId }, { status: 501 });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  return NextResponse.json({ message: "TODO: unassign tag from todo", todoId: id, userId: session.userId }, { status: 501 });
}