import { describe, expect, test } from "bun:test";
import { listPage } from "./listPage";

describe("student list pagination", () => {
  const students = Array.from({ length: 2538 }, (_, i) => i);
  test("limits rendered records without truncating the total", () => {
    const result = listPage(students, 1);
    expect(result.rows).toHaveLength(50);
    expect(result.pages).toBe(51);
  });
  test("records beyond the previous 1000-row boundary remain reachable", () => {
    expect(listPage(students, 21).rows[0]).toBe(1000);
    expect(listPage(students, 51).rows.at(-1)).toBe(2537);
  });
  test("clamps the page after filtering", () => {
    expect(listPage([2537], 51)).toEqual({ page: 1, pages: 1, rows: [2537] });
    expect(listPage([], 4).rows).toEqual([]);
  });
});