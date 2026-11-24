export const STUDENT_PAGE_SIZE = 50;

export function listPage<T>(items: T[], requestedPage: number, size = STUDENT_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.max(1, requestedPage), pages);
  return { page, pages, rows: items.slice((page - 1) * size, page * size) };
}