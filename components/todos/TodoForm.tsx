"use client";

export default function TodoForm() {
  return (
    <form>
      <input aria-label="Todo title" placeholder="Add a todo" type="text" />
      <button type="submit">Add Todo</button>
    </form>
  );
}