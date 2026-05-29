import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';
import { parseTodoCreateInput } from '@/lib/validators';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const priorityFilter = searchParams.get('priority');

  if (priorityFilter && priorityFilter !== 'all' && !['high', 'medium', 'low'].includes(priorityFilter)) {
    return NextResponse.json({ error: 'Invalid priority filter' }, { status: 400 });
  }

  const todos = todoDB.listForUser(session.userId)
    .filter((todo) => {
      if (!priorityFilter || priorityFilter === 'all') {
        return true;
      }
      return todo.priority === priorityFilter;
    })
    .map((todo) => ({
      ...todo,
      subtasks: subtaskDB.listForTodo(todo.id),
    }));

  return NextResponse.json({ todos });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = parseTodoCreateInput(body);
    const todo = todoDB.create({
      userId: session.userId,
      title: input.title,
      dueDate: input.dueDate,
      priority: input.priority,
      isRecurring: input.isRecurring,
      recurrencePattern: input.recurrencePattern,
      reminderMinutes: input.reminderMinutes,
    });

    return NextResponse.json({ todo: { ...todo, subtasks: [] } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
