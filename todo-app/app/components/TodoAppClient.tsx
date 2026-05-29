'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import LogoutButton from '@/app/components/LogoutButton';
import { formatDateTimeForInput } from '@/lib/timezone';
import { reminderLabel } from '@/lib/validators';

type Priority = 'high' | 'medium' | 'low';
type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

type Subtask = {
  id: number;
  todo_id: number;
  title: string;
  completed: number;
  position: number;
  created_at: string;
};

type Todo = {
  id: number;
  title: string;
  completed: number;
  due_date: string | null;
  priority: Priority;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  total_subtasks: number;
  completed_subtasks: number;
  subtasks: Subtask[];
};

type TodoFormState = {
  title: string;
  dueDate: string;
  priority: Priority;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  reminderMinutes: string;
};

const DEFAULT_FORM: TodoFormState = {
  title: '',
  dueDate: '',
  priority: 'medium',
  isRecurring: false,
  recurrencePattern: 'daily',
  reminderMinutes: '',
};

const PRIORITY_BADGES: Record<Priority, string> = {
  high: 'bg-red-700 text-red-100',
  medium: 'bg-amber-600 text-amber-100',
  low: 'bg-blue-700 text-blue-100',
};

const REMINDER_OPTIONS = [15, 30, 60, 120, 1440, 2880, 10080];

function toRequestPayload(form: TodoFormState) {
  return {
    title: form.title,
    dueDate: form.dueDate || null,
    priority: form.priority,
    isRecurring: form.isRecurring,
    recurrencePattern: form.isRecurring ? form.recurrencePattern : null,
    reminderMinutes: form.reminderMinutes ? Number(form.reminderMinutes) : null,
  };
}

function groupTodos(todos: Todo[]) {
  const now = Date.now();
  const overdue: Todo[] = [];
  const active: Todo[] = [];
  const completed: Todo[] = [];

  todos.forEach((todo) => {
    if (todo.completed === 1) {
      completed.push(todo);
      return;
    }

    if (todo.due_date && new Date(todo.due_date).getTime() < now) {
      overdue.push(todo);
      return;
    }

    active.push(todo);
  });

  return { overdue, active, completed };
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const barColor = percentage === 100 ? 'bg-emerald-500' : 'bg-sky-500';

  return (
    <div className="mt-2">
      <div className="mb-1 text-xs text-zinc-400">{completed}/{total} subtasks</div>
      <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function TodoAppClient({ username }: { username: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState<TodoFormState>(DEFAULT_FORM);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [expandedTodoIds, setExpandedTodoIds] = useState<number[]>([]);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined') {
      return 'default';
    }
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const fetchTodos = useCallback(async (filter: 'all' | Priority) => {
    const url = filter === 'all' ? '/api/todos' : `/api/todos?priority=${filter}`;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to load todos');
    }

    return data.todos as Todo[];
  }, []);

  const refreshTodos = useCallback(async () => {
    const nextTodos = await fetchTodos(priorityFilter);
    setTodos(nextTodos);
  }, [fetchTodos, priorityFilter]);

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      try {
        const nextTodos = await fetchTodos(priorityFilter);
        if (!isCancelled) {
          setTodos(nextTodos);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load todos');
        }
      }
    }

    void run();

    return () => {
      isCancelled = true;
    };
  }, [fetchTodos, priorityFilter]);

  useEffect(() => {
    if (permission !== 'granted') {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch('/api/notifications/check', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const reminders = Array.isArray(data.reminders) ? data.reminders : [];

        reminders.forEach((reminder: { title: string; due_date: string }) => {
          const dueLabel = new Date(reminder.due_date).toLocaleString('en-SG', {
            timeZone: 'Asia/Singapore',
          });
          new Notification('Todo reminder', {
            body: `${reminder.title} is due at ${dueLabel}`,
          });
        });
      } catch {
        // Ignore transient polling errors.
      }
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [permission]);

  const groupedTodos = useMemo(() => groupTodos(todos), [todos]);

  function resetForm() {
    setForm(DEFAULT_FORM);
    setEditingTodoId(null);
  }

  function startEditing(todo: Todo) {
    setEditingTodoId(todo.id);
    setForm({
      title: todo.title,
      dueDate: formatDateTimeForInput(todo.due_date),
      priority: todo.priority,
      isRecurring: todo.is_recurring === 1,
      recurrencePattern: todo.recurrence_pattern ?? 'daily',
      reminderMinutes: todo.reminder_minutes ? String(todo.reminder_minutes) : '',
    });
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();

    setError('');
    setIsSaving(true);

    const payload = toRequestPayload(form);
    const isEditing = editingTodoId !== null;

    try {
      if (!isEditing) {
        const tempId = -Date.now();
        const optimisticTodo: Todo = {
          id: tempId,
          title: payload.title,
          completed: 0,
          due_date: payload.dueDate,
          priority: payload.priority,
          is_recurring: payload.isRecurring ? 1 : 0,
          recurrence_pattern: payload.recurrencePattern,
          reminder_minutes: payload.reminderMinutes,
          total_subtasks: 0,
          completed_subtasks: 0,
          subtasks: [],
        };

        setTodos((current) => [optimisticTodo, ...current]);

        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
          setTodos((current) => current.filter((todo) => todo.id !== tempId));
          throw new Error(data.error ?? 'Failed to create todo');
        }
      } else {
        const response = await fetch(`/api/todos/${editingTodoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to update todo');
        }
      }

      await refreshTodos();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save todo');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCompleted(todo: Todo) {
    const response = await fetch(`/api/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: todo.completed === 0 }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Failed to update todo');
      return;
    }

    await refreshTodos();
  }

  async function deleteTodo(todoId: number) {
    const previous = todos;
    setTodos((current) => current.filter((todo) => todo.id !== todoId));

    const response = await fetch(`/api/todos/${todoId}`, { method: 'DELETE' });
    if (!response.ok) {
      setTodos(previous);
      const data = await response.json();
      setError(data.error ?? 'Failed to delete todo');
      return;
    }

    await refreshTodos();
  }

  function toggleExpanded(todoId: number) {
    setExpandedTodoIds((current) =>
      current.includes(todoId) ? current.filter((id) => id !== todoId) : [...current, todoId]
    );
  }

  async function addSubtask(todoId: number) {
    const title = (subtaskDrafts[todoId] ?? '').trim();
    if (!title) {
      setError('Subtask title is required');
      return;
    }

    const response = await fetch(`/api/todos/${todoId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? 'Failed to add subtask');
      return;
    }

    setSubtaskDrafts((current) => ({ ...current, [todoId]: '' }));
    await refreshTodos();
  }

  async function toggleSubtask(subtask: Subtask) {
    const response = await fetch(`/api/subtasks/${subtask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: subtask.completed === 0 }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? 'Failed to update subtask');
      return;
    }

    await refreshTodos();
  }

  async function deleteSubtask(subtaskId: number) {
    const response = await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? 'Failed to delete subtask');
      return;
    }

    await refreshTodos();
  }

  async function requestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    const next = await Notification.requestPermission();
    setPermission(next);
  }

  function renderTodoSection(title: string, sectionTodos: Todo[]) {
    return (
      <section className="mt-6">
        <h2 className="text-xl font-semibold">{title} ({sectionTodos.length})</h2>
        <div className="mt-3 space-y-3">
          {sectionTodos.map((todo) => {
            const isExpanded = expandedTodoIds.includes(todo.id);

            return (
              <article key={todo.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed === 1}
                      onChange={() => {
                        void toggleCompleted(todo);
                      }}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-medium ${todo.completed === 1 ? 'line-through text-zinc-500' : ''}`}>
                          {todo.title}
                        </p>
                        <span className={`rounded px-2 py-0.5 text-xs ${PRIORITY_BADGES[todo.priority]}`}>
                          {todo.priority}
                        </span>
                        {todo.is_recurring === 1 && (
                          <span className="rounded bg-violet-700 px-2 py-0.5 text-xs text-violet-100">
                            {todo.recurrence_pattern}
                          </span>
                        )}
                        {todo.reminder_minutes !== null && (
                          <span className="rounded bg-cyan-700 px-2 py-0.5 text-xs text-cyan-100">
                            {reminderLabel(todo.reminder_minutes)}
                          </span>
                        )}
                      </div>
                      {todo.due_date && (
                        <p className="mt-1 text-sm text-zinc-400">
                          Due: {new Date(todo.due_date).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}
                        </p>
                      )}
                      <ProgressBar completed={todo.completed_subtasks} total={todo.total_subtasks} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => startEditing(todo)}
                      className="rounded bg-zinc-700 px-3 py-1 hover:bg-zinc-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteTodo(todo.id);
                      }}
                      className="rounded bg-rose-700 px-3 py-1 hover:bg-rose-600"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(todo.id)}
                      className="rounded bg-zinc-700 px-3 py-1 hover:bg-zinc-600"
                    >
                      {isExpanded ? 'Hide subtasks' : 'Subtasks'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 rounded border border-zinc-800 bg-zinc-950 p-3">
                    <div className="mb-3 flex gap-2">
                      <input
                        value={subtaskDrafts[todo.id] ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSubtaskDrafts((current) => ({ ...current, [todo.id]: value }));
                        }}
                        placeholder="Add subtask"
                        className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void addSubtask(todo.id);
                        }}
                        className="rounded bg-sky-700 px-3 py-2 text-sm hover:bg-sky-600"
                      >
                        Add
                      </button>
                    </div>

                    <ul className="space-y-2">
                      {todo.subtasks.map((subtask) => (
                        <li key={subtask.id} className="flex items-center justify-between rounded bg-zinc-900 px-3 py-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={subtask.completed === 1}
                              onChange={() => {
                                void toggleSubtask(subtask);
                              }}
                            />
                            <span className={subtask.completed === 1 ? 'line-through text-zinc-500' : ''}>
                              {subtask.title}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              void deleteSubtask(subtask.id);
                            }}
                            className="rounded bg-zinc-700 px-2 py-1 text-xs hover:bg-zinc-600"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-sm text-zinc-400">Signed in as</p>
          <p className="text-lg font-semibold">{username}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pb-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Todo App</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void requestNotifications();
              }}
              className="rounded bg-indigo-700 px-3 py-2 text-sm hover:bg-indigo-600"
            >
              Enable Notifications
            </button>
            <span className="text-xs text-zinc-400">{permission}</span>
          </div>
        </div>

        <form onSubmit={(event) => {
          void submitForm(event);
        }} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="What needs to be done?"
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              required
            />

            <select
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({ ...current, priority: event.target.value as Priority }))
              }
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
            />

            <select
              value={form.reminderMinutes}
              onChange={(event) => setForm((current) => ({ ...current, reminderMinutes: event.target.value }))}
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              disabled={!form.dueDate}
            >
              <option value="">No reminder</option>
              {REMINDER_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {reminderLabel(minutes)} before
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isRecurring: event.target.checked }))
                }
              />
              Repeat task
            </label>

            <select
              value={form.recurrencePattern}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recurrencePattern: event.target.value as RecurrencePattern,
                }))
              }
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              disabled={!form.isRecurring}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded bg-emerald-700 px-4 py-2 hover:bg-emerald-600 disabled:opacity-50"
            >
              {editingTodoId === null ? 'Create Todo' : 'Save Changes'}
            </button>
            {editingTodoId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded bg-zinc-700 px-4 py-2 hover:bg-zinc-600"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="priority-filter" className="text-sm text-zinc-300">
            Priority filter:
          </label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as 'all' | Priority)}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {renderTodoSection('Overdue', groupedTodos.overdue)}
        {renderTodoSection('Active', groupedTodos.active)}
        {renderTodoSection('Completed', groupedTodos.completed)}
      </section>
    </main>
  );
}
