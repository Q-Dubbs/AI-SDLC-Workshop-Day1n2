"use client";

export default function SearchFilters() {
  return (
    <section>
      <input aria-label="Search todos" placeholder="Search by title or tag" type="search" />
      <button type="button">Clear Filters</button>
    </section>
  );
}