import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, tagDB, todoDB } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const todos = todoDB.listByUser(session.userId);
  const tags = tagDB.listByUser(session.userId);

  const enrichedTodos = todos.map((todo) => ({
    ...todo,
    subtasks: subtaskDB.listByTodo(todo.id),
    tag_ids: tagDB
      .listForTodo(session.userId, todo.id)
      .map((tag) => tag.id)
      .sort((a, b) => a - b),
  }));

  return NextResponse.json({
    version: 1,
    exported_at: new Date().toISOString(),
    data: {
      todos: enrichedTodos,
      tags,
    },
  });
}
