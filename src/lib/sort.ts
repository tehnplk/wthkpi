export type SortDir = "asc" | "desc";

export function toggleSort(current: SortDir | null, by: string, active: string | null): { sortBy: string; sortDir: SortDir } {
  if (active !== by) return { sortBy: by, sortDir: "asc" };
  if (current === "asc") return { sortBy: by, sortDir: "desc" };
  return { sortBy: by, sortDir: "asc" };
}

export function applySort<T>(data: T[], sortBy: string | null, sortDir: SortDir | null): T[] {
  if (!sortBy || !sortDir) return data;
  return [...data].sort((a, b) => {
    const va = getVal(a, sortBy);
    const vb = getVal(b, sortBy);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = typeof va === "number" && typeof vb === "number"
      ? va - vb
      : String(va).localeCompare(String(vb), "th", { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });
}

function getVal(obj: unknown, path: string): unknown {
  return path.split(".").reduce((cur: unknown, key) => {
    if (cur == null) return undefined;
    return (cur as Record<string, unknown>)[key];
  }, obj);
}
