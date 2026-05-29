'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import LogoutButton from '@/app/components/LogoutButton';
import { useNotifications } from '@/lib/hooks/useNotifications';

type Priority = 'high' | 'medium' | 'low';
type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

type Subtask = {
  id: number;
  title: string;
  is_completed: number;
};

type Tag = {
  id: number;
  name: string;
  color: string;
};

type Todo = {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  is_completed: number;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  subtasks: Subtask[];
  tags: Tag[];
};

type Template = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  title: string;
  todo_description: string | null;
  priority: Priority;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  due_date_offset_days: number | null;
  subtasks_json: string | null;
  tag_ids_json: string | null;
};

type FormState = {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  reminderMinutes: string;
  selectedTagIds: number[];
  subtasksText: string;
};

const initialForm: FormState = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  isRecurring: false,
  recurrencePattern: 'daily',
  reminderMinutes: '',
  selectedTagIds: [],
  subtasksText: '',
};

const reminderOptions = [
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '120', label: '2 hours before' },
  { value: '1440', label: '1 day before' },
  { value: '2880', label: '2 days before' },
  { value: '10080', label: '1 week before' },
];

function toIsoFromInput(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function parseSubtasksText(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#2563eb');
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('general');
  const [templateDescription, setTemplateDescription] = useState('');
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowSnapshot, setNowSnapshot] = useState(0);
  const { enabled, permission, requestPermission } = useNotifications();

  async function loadData() {
    try {
      const [meRes, todoRes, tagRes, templateRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/todos'),
        fetch('/api/tags'),
        fetch('/api/templates'),
      ]);

      if (!meRes.ok || !todoRes.ok || !tagRes.ok || !templateRes.ok) {
        throw new Error('Unable to load data');
      }

      const mePayload = (await meRes.json()) as { user?: { username: string } };
      const todoPayload = (await todoRes.json()) as { todos?: Todo[] };
      const tagPayload = (await tagRes.json()) as { tags?: Tag[] };
      const templatePayload = (await templateRes.json()) as { templates?: Template[] };

      setUsername(mePayload.user?.username ?? '');
      setTodos(Array.isArray(todoPayload.todos) ? todoPayload.todos : []);
      setTags(Array.isArray(tagPayload.tags) ? tagPayload.tags : []);
      setTemplates(Array.isArray(templatePayload.templates) ? templatePayload.templates : []);
      setNowSnapshot(new Date().getTime());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load app data');
    }
  }

  useEffect(() => {
    let active = true;

    async function loadOnMount() {
      try {
        const [meRes, todoRes, tagRes, templateRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/todos'),
          fetch('/api/tags'),
          fetch('/api/templates'),
        ]);

        if (!active) {
          return;
        }

        if (!meRes.ok || !todoRes.ok || !tagRes.ok || !templateRes.ok) {
          throw new Error('Unable to load data');
        }

        const mePayload = (await meRes.json()) as { user?: { username: string } };
        const todoPayload = (await todoRes.json()) as { todos?: Todo[] };
        const tagPayload = (await tagRes.json()) as { tags?: Tag[] };
        const templatePayload = (await templateRes.json()) as { templates?: Template[] };

        setUsername(mePayload.user?.username ?? '');
        setTodos(Array.isArray(todoPayload.todos) ? todoPayload.todos : []);
        setTags(Array.isArray(tagPayload.tags) ? tagPayload.tags : []);
        setTemplates(Array.isArray(templatePayload.templates) ? templatePayload.templates : []);
        setNowSnapshot(new Date().getTime());
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Unable to load app data');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOnMount();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const filteredTodos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return todos.filter((todo) => {
      if (priorityFilter !== 'all' && todo.priority !== priorityFilter) {
        return false;
      }

      if (tagFilter !== null && !todo.tags.some((tag) => tag.id === tagFilter)) {
        return false;
      }

      if (!term) {
        return true;
      }

      const inTitle = todo.title.toLowerCase().includes(term);
      const inTags = todo.tags.some((tag) => tag.name.toLowerCase().includes(term));
      return inTitle || inTags;
    });
  }, [priorityFilter, searchTerm, tagFilter, todos]);

  const sections = useMemo(() => {
    const now = nowSnapshot;
    const overdue: Todo[] = [];
    const active: Todo[] = [];
    const completed: Todo[] = [];

    for (const todo of filteredTodos) {
      if (todo.is_completed === 1) {
        completed.push(todo);
        continue;
      }

      const dueTime = todo.due_date ? new Date(todo.due_date).getTime() : null;
      if (dueTime !== null && !Number.isNaN(dueTime) && dueTime < now) {
        overdue.push(todo);
      } else {
        active.push(todo);
      }
    }

    return { overdue, active, completed };
  }, [filteredTodos, nowSnapshot]);

  async function handleCreateTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      due_date: toIsoFromInput(form.dueDate),
      is_recurring: form.isRecurring,
      recurrence_pattern: form.isRecurring ? form.recurrencePattern : null,
      reminder_minutes: form.reminderMinutes ? Number(form.reminderMinutes) : null,
      tag_ids: form.selectedTagIds,
      subtasks: parseSubtasksText(form.subtasksText),
    };

    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as { todo?: Todo; error?: string };
    if (!response.ok || !body.todo) {
      setError(body.error ?? 'Unable to create todo');
      return;
    }

    setTodos((previous) => [body.todo as Todo, ...previous]);
    setForm(initialForm);
    setMessage('Todo created');
  }

  async function updateTodo(todo: Todo, patch: Partial<Todo>) {
    const optimistic = { ...todo, ...patch } as Todo;
    setTodos((previous) => previous.map((item) => (item.id === todo.id ? optimistic : item)));

    const response = await fetch(`/api/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(patch.title !== undefined ? { title: optimistic.title } : {}),
        ...(patch.description !== undefined ? { description: optimistic.description } : {}),
        ...(patch.priority !== undefined ? { priority: optimistic.priority } : {}),
        ...(patch.due_date !== undefined ? { due_date: optimistic.due_date } : {}),
        ...(patch.is_completed !== undefined ? { is_completed: optimistic.is_completed } : {}),
        ...(patch.is_recurring !== undefined ? { is_recurring: optimistic.is_recurring } : {}),
        ...(patch.recurrence_pattern !== undefined
          ? { recurrence_pattern: optimistic.recurrence_pattern }
          : {}),
        ...(patch.reminder_minutes !== undefined
          ? { reminder_minutes: optimistic.reminder_minutes }
          : {}),
      }),
    });

    const body = (await response.json()) as { todo?: Todo; error?: string };
    if (!response.ok || !body.todo) {
      setError(body.error ?? 'Unable to update todo');
      setTodos((previous) => previous.map((item) => (item.id === todo.id ? todo : item)));
      return;
    }

    setTodos((previous) => previous.map((item) => (item.id === todo.id ? (body.todo as Todo) : item)));
  }

  async function handleDeleteTodo(todoId: number) {
    const confirmed = window.confirm('Delete this todo? This will also delete subtasks.');
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/todos/${todoId}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Unable to delete todo');
      return;
    }

    setTodos((previous) => previous.filter((todo) => todo.id !== todoId));
    setMessage('Todo deleted');
  }

  async function handleAddSubtask(todoId: number) {
    const draft = (subtaskDrafts[todoId] ?? '').trim();
    if (!draft) {
      return;
    }

    const response = await fetch(`/api/todos/${todoId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: draft }),
    });

    const payload = (await response.json()) as { subtask?: Subtask; error?: string };
    if (!response.ok || !payload.subtask) {
      setError(payload.error ?? 'Unable to add subtask');
      return;
    }

    setTodos((previous) =>
      previous.map((todo) =>
        todo.id === todoId ? { ...todo, subtasks: [...todo.subtasks, payload.subtask as Subtask] } : todo
      )
    );
    setSubtaskDrafts((previous) => ({ ...previous, [todoId]: '' }));
  }

  async function handleToggleSubtask(todoId: number, subtask: Subtask) {
    const response = await fetch(`/api/subtasks/${subtask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: subtask.title, is_completed: subtask.is_completed !== 1 }),
    });

    if (!response.ok) {
      setError('Unable to update subtask');
      return;
    }

    setTodos((previous) =>
      previous.map((todo) => {
        if (todo.id !== todoId) {
          return todo;
        }
        return {
          ...todo,
          subtasks: todo.subtasks.map((item) =>
            item.id === subtask.id ? { ...item, is_completed: item.is_completed === 1 ? 0 : 1 } : item
          ),
        };
      })
    );
  }

  async function handleDeleteSubtask(todoId: number, subtaskId: number) {
    const response = await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Unable to delete subtask');
      return;
    }

    setTodos((previous) =>
      previous.map((todo) =>
        todo.id === todoId
          ? { ...todo, subtasks: todo.subtasks.filter((item) => item.id !== subtaskId) }
          : todo
      )
    );
  }

  async function handleCreateTag() {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName, color: newTagColor }),
    });

    const payload = (await response.json()) as { tag?: Tag; error?: string };
    if (!response.ok || !payload.tag) {
      setError(payload.error ?? 'Unable to create tag');
      return;
    }

    setTags((previous) => [...previous, payload.tag as Tag]);
    setNewTagName('');
    setMessage('Tag created');
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    const dueDateIso = toIsoFromInput(form.dueDate);
    const dueDateOffsetDays = dueDateIso
      ? Math.max(0, Math.ceil((new Date(dueDateIso).getTime() - new Date().getTime()) / 86_400_000))
      : null;

    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateName,
        description: templateDescription,
        category: templateCategory,
        title: form.title || 'Template todo',
        todo_description: form.description,
        priority: form.priority,
        is_recurring: form.isRecurring,
        recurrence_pattern: form.isRecurring ? form.recurrencePattern : null,
        reminder_minutes: form.reminderMinutes ? Number(form.reminderMinutes) : null,
        due_date_offset_days: dueDateOffsetDays,
        subtasks_json: JSON.stringify(parseSubtasksText(form.subtasksText).map((title) => ({ title }))),
        tag_ids_json: JSON.stringify(form.selectedTagIds),
      }),
    });

    const payload = (await response.json()) as { template?: Template; error?: string };
    if (!response.ok || !payload.template) {
      setError(payload.error ?? 'Unable to save template');
      return;
    }

    setTemplates((previous) => [payload.template as Template, ...previous]);
    setTemplateName('');
    setTemplateDescription('');
    setMessage('Template saved');
  }

  async function handleUseTemplate(templateId: number) {
    const response = await fetch(`/api/templates/${templateId}/use`, { method: 'POST' });
    const payload = (await response.json()) as { todo?: Todo; error?: string };

    if (!response.ok || !payload.todo) {
      setError(payload.error ?? 'Unable to use template');
      return;
    }

    setTodos((previous) => [payload.todo as Todo, ...previous]);
    setMessage('Todo created from template');
  }

  async function handleExport() {
    const response = await fetch('/api/todos/export');
    if (!response.ok) {
      setError('Unable to export data');
      return;
    }

    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'todos-export.json';
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const response = await fetch('/api/todos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? 'Unable to import data');
        return;
      }

      await loadData();
      setMessage('Import completed');
    } catch {
      setError('Invalid JSON file');
    } finally {
      event.target.value = '';
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-zinc-950 p-8 text-zinc-100">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-sm text-zinc-400">Signed in as</p>
          <p className="text-lg font-semibold">{username}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link className="rounded-md border border-zinc-700 px-3 py-1 text-sm" href="/calendar">
            Calendar
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-10 lg:grid-cols-[1.1fr_2fr]">
        <aside className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold">Create Todo</h2>
          <form className="space-y-3" onSubmit={handleCreateTodo}>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="Todo title"
              value={form.title}
              onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
            />
            <textarea
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="Description"
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, description: event.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                value={form.priority}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, priority: event.target.value as Priority }))
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input
                type="datetime-local"
                className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, dueDate: event.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, isRecurring: event.target.checked }))
                }
              />
              Recurring
            </label>

            {form.isRecurring ? (
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                value={form.recurrencePattern}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    recurrencePattern: event.target.value as RecurrencePattern,
                  }))
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            ) : null}

            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              value={form.reminderMinutes}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, reminderMinutes: event.target.value }))
              }
              disabled={!form.dueDate}
            >
              <option value="">No reminder</option>
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <textarea
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="Subtasks, one per line"
              value={form.subtasksText}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, subtasksText: event.target.value }))
              }
            />

            <div className="rounded-md border border-zinc-800 p-2">
              <p className="text-sm text-zinc-400">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.selectedTagIds.includes(tag.id)}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          selectedTagIds: event.target.checked
                            ? [...previous.selectedTagIds, tag.id]
                            : previous.selectedTagIds.filter((id) => id !== tag.id),
                        }))
                      }
                    />
                    <span style={{ color: tag.color }}>#{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="w-full rounded-md bg-emerald-500 px-3 py-2 font-medium text-zinc-900" type="submit">
              Create todo
            </button>
          </form>

          <div className="rounded-md border border-zinc-800 p-3">
            <p className="font-medium">Notifications</p>
            <p className="mt-1 text-xs text-zinc-400">Permission: {permission}</p>
            <button
              type="button"
              className="mt-2 rounded-md border border-zinc-700 px-3 py-1 text-sm"
              onClick={requestPermission}
            >
              {enabled ? 'Notifications enabled' : 'Enable notifications'}
            </button>
          </div>

          <div className="rounded-md border border-zinc-800 p-3">
            <p className="font-medium">Tag Management</p>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                placeholder="new tag"
                value={newTagName}
                onChange={(event) => setNewTagName(event.target.value)}
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(event) => setNewTagColor(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="mt-2 rounded-md border border-zinc-700 px-3 py-1 text-sm"
              onClick={handleCreateTag}
            >
              Add tag
            </button>
          </div>

          <div className="rounded-md border border-zinc-800 p-3">
            <p className="font-medium">Templates</p>
            <div className="mt-2 space-y-2">
              <input
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                placeholder="Template name"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
              />
              <input
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                placeholder="Category"
                value={templateCategory}
                onChange={(event) => setTemplateCategory(event.target.value)}
              />
              <input
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                placeholder="Description"
                value={templateDescription}
                onChange={(event) => setTemplateDescription(event.target.value)}
              />
              <button
                type="button"
                className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
                onClick={handleSaveTemplate}
              >
                Save current form as template
              </button>
            </div>
            <div className="mt-3 max-h-36 space-y-2 overflow-auto">
              {templates.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  className="block w-full rounded-md border border-zinc-700 px-2 py-1 text-left text-sm"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  {template.name} {template.category ? `(${template.category})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
              onClick={handleExport}
            >
              Export JSON
            </button>
            <label className="rounded-md border border-zinc-700 px-3 py-1 text-sm">
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h1 className="text-2xl font-bold">Todo Dashboard</h1>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <input
                className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                placeholder="Search title or tags"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <select
                className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as 'all' | Priority)}
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                type="button"
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm"
                onClick={() => {
                  setSearchTerm('');
                  setPriorityFilter('all');
                  setTagFilter(null);
                }}
              >
                Clear filters
              </button>
            </div>
            {tagFilter !== null ? (
              <p className="mt-2 text-sm text-zinc-400">
                Filtering by tag:{' '}
                {tags.find((tag) => tag.id === tagFilter)?.name ?? 'unknown'}
              </p>
            ) : null}
          </div>

          {error ? <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}
          {message ? (
            <p className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>
          ) : null}

          {(['overdue', 'active', 'completed'] as const).map((sectionKey) => {
            const sectionTodos = sections[sectionKey];
            return (
              <div key={sectionKey} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <h2 className="text-lg font-semibold capitalize">
                  {sectionKey} ({sectionTodos.length})
                </h2>

                {sectionTodos.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500">No todos in this section.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {sectionTodos.map((todo) => {
                      const completedSubtasks = todo.subtasks.filter(
                        (subtask) => subtask.is_completed === 1
                      ).length;
                      const progress =
                        todo.subtasks.length > 0
                          ? Math.round((completedSubtasks / todo.subtasks.length) * 100)
                          : 0;

                      return (
                        <article key={todo.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={todo.is_completed === 1}
                                onChange={() =>
                                  updateTodo(todo, { is_completed: todo.is_completed === 1 ? 0 : 1 })
                                }
                              />
                              <div>
                                <p className={todo.is_completed === 1 ? 'line-through text-zinc-500' : ''}>
                                  {todo.title}
                                </p>
                                {todo.description ? (
                                  <p className="text-sm text-zinc-400">{todo.description}</p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span className="rounded bg-zinc-800 px-2 py-1">{todo.priority}</span>
                                  {todo.is_recurring === 1 && todo.recurrence_pattern ? (
                                    <span className="rounded bg-cyan-950 px-2 py-1 text-cyan-200">
                                      repeating {todo.recurrence_pattern}
                                    </span>
                                  ) : null}
                                  {todo.reminder_minutes !== null ? (
                                    <span className="rounded bg-amber-950 px-2 py-1 text-amber-200">
                                      reminder {todo.reminder_minutes}m
                                    </span>
                                  ) : null}
                                  {todo.due_date ? (
                                    <span className="rounded bg-zinc-800 px-2 py-1">
                                      due {new Date(todo.due_date).toLocaleString()}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {todo.tags.map((tag) => (
                                    <button
                                      key={tag.id}
                                      type="button"
                                      className="rounded px-2 py-1 text-xs"
                                      style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                                      onClick={() => setTagFilter(tag.id)}
                                    >
                                      #{tag.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-md border border-zinc-700 px-2 py-1 text-xs"
                                onClick={() => {
                                  const title = window.prompt('Edit title', todo.title);
                                  if (!title || !title.trim()) {
                                    return;
                                  }
                                  updateTodo(todo, { title: title.trim() });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="rounded-md border border-rose-800 px-2 py-1 text-xs text-rose-300"
                                onClick={() => handleDeleteTodo(todo.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                              <span>Subtasks progress</span>
                              <span>
                                {completedSubtasks}/{todo.subtasks.length} ({progress}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-800">
                              <div
                                className={
                                  progress === 100
                                    ? 'h-2 rounded-full bg-emerald-500'
                                    : 'h-2 rounded-full bg-blue-500'
                                }
                                style={{ width: `${progress}%` }}
                              />
                            </div>

                            <div className="mt-3 space-y-2">
                              {todo.subtasks.map((subtask) => (
                                <div key={subtask.id} className="flex items-center justify-between gap-2 text-sm">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={subtask.is_completed === 1}
                                      onChange={() => handleToggleSubtask(todo.id, subtask)}
                                    />
                                    <span
                                      className={
                                        subtask.is_completed === 1 ? 'line-through text-zinc-500' : ''
                                      }
                                    >
                                      {subtask.title}
                                    </span>
                                  </label>
                                  <button
                                    type="button"
                                    className="text-xs text-rose-300"
                                    onClick={() => handleDeleteSubtask(todo.id, subtask.id)}
                                  >
                                    remove
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 flex gap-2">
                              <input
                                className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
                                placeholder="Add subtask"
                                value={subtaskDrafts[todo.id] ?? ''}
                                onChange={(event) =>
                                  setSubtaskDrafts((previous) => ({
                                    ...previous,
                                    [todo.id]: event.target.value,
                                  }))
                                }
                              />
                              <button
                                type="button"
                                className="rounded-md border border-zinc-700 px-2 py-1 text-xs"
                                onClick={() => handleAddSubtask(todo.id)}
                              >
                                add
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </section>
    </main>
  );
}
