/**
 * The backend returns at most 1000 rows per request. Pages through a query
 * until all rows are loaded so dashboard counts and lists are complete.
 * `build` must return a fresh query (with a stable order) each call.
 */
export async function fetchAll<T = any>(
  build: () => any,
  pageSize = 1000,
): Promise<{ data: T[]; error: any }> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) return { data: out, error };
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < pageSize) return { data: out, error: null };
  }
}
