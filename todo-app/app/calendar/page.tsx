'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Todo = {
  id: number;
  title: string;
  due_date: string | null;
  is_completed: number;
};

type Holiday = {
  id: number;
  date: string;
  name: string;
};

function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function buildCalendarDays(currentMonth: Date): Date[] {
  const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const monthKey = useMemo(() => getMonthKey(selectedMonth), [selectedMonth]);

  useEffect(() => {
    async function loadData() {
      const [holidayRes, todoRes] = await Promise.all([
        fetch(`/api/holidays?month=${monthKey}`),
        fetch('/api/todos'),
      ]);

      if (holidayRes.ok) {
        const holidayPayload = (await holidayRes.json()) as { holidays?: Holiday[] };
        setHolidays(Array.isArray(holidayPayload.holidays) ? holidayPayload.holidays : []);
      }

      if (todoRes.ok) {
        const todoPayload = (await todoRes.json()) as { todos?: Todo[] };
        setTodos(Array.isArray(todoPayload.todos) ? todoPayload.todos : []);
      }
    }

    loadData();
  }, [monthKey]);

  const days = useMemo(() => buildCalendarDays(selectedMonth), [selectedMonth]);
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const holiday of holidays) {
      const current = map.get(holiday.date) ?? [];
      map.set(holiday.date, [...current, holiday]);
    }
    return map;
  }, [holidays]);

  const todosByDate = useMemo(() => {
    const map = new Map<string, Todo[]>();
    for (const todo of todos) {
      if (!todo.due_date) {
        continue;
      }
      const key = todo.due_date.slice(0, 10);
      const current = map.get(key) ?? [];
      map.set(key, [...current, todo]);
    }
    return map;
  }, [todos]);

  const activeTodos = activeDate ? todosByDate.get(activeDate) ?? [] : [];

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-sm text-zinc-400">Singapore holidays and todo due dates</p>
          </div>
          <Link href="/" className="rounded-md border border-zinc-700 px-3 py-1 text-sm">
            Back to todos
          </Link>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <button
            type="button"
            className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
            onClick={() =>
              setSelectedMonth(
                (previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1)
              )
            }
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
            onClick={() => {
              const now = new Date();
              setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
          >
            Today
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
            onClick={() =>
              setSelectedMonth(
                (previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1)
              )
            }
          >
            Next
          </button>
          <p className="ml-auto text-sm font-medium">
            {selectedMonth.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs text-zinc-400">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <p key={day}>{day}</p>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const key = toDateKey(day);
            const dayTodos = todosByDate.get(key) ?? [];
            const dayHolidays = holidayMap.get(key) ?? [];
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
            const isToday = toDateKey(new Date()) === key;

            return (
              <button
                key={key}
                type="button"
                className={[
                  'min-h-28 rounded-lg border p-2 text-left',
                  isCurrentMonth ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-900 bg-zinc-950 text-zinc-600',
                  isWeekend ? 'ring-1 ring-zinc-800' : '',
                  isToday ? 'ring-2 ring-emerald-500' : '',
                ].join(' ')}
                onClick={() => setActiveDate(key)}
              >
                <p className="text-xs">{day.getDate()}</p>
                {dayHolidays.slice(0, 1).map((holiday) => (
                  <p key={holiday.id} className="mt-1 truncate text-xs text-rose-300">
                    {holiday.name}
                  </p>
                ))}
                {dayTodos.length > 0 ? (
                  <p className="mt-1 inline-block rounded bg-emerald-900 px-2 py-0.5 text-xs text-emerald-200">
                    {dayTodos.length} todo{dayTodos.length > 1 ? 's' : ''}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>

        {activeDate ? (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Todos on {activeDate}</h2>
                <button
                  type="button"
                  className="rounded-md border border-zinc-700 px-2 py-1 text-sm"
                  onClick={() => setActiveDate(null)}
                >
                  Close
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {activeTodos.length === 0 ? (
                  <p className="text-sm text-zinc-400">No todos for this date.</p>
                ) : (
                  activeTodos.map((todo) => (
                    <div key={todo.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-2 text-sm">
                      <p>{todo.title}</p>
                      {todo.is_completed === 1 ? (
                        <p className="text-xs text-emerald-300">Completed</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
