import { describe, expect, test } from "bun:test";
import { newPendingReceiptIds } from "./adminDashboardData";

describe("receipt alerts with lightweight polling", () => {
  test("existing pending receipts are not announced at startup", () => {
    expect(newPendingReceiptIds(null, [{ id: "existing" }])).toEqual([]);
  });
  test("only newly submitted receipts are announced", () => {
    expect(newPendingReceiptIds(new Set(["old"]), [{ id: "old" }, { id: "new" }])).toEqual(["new"]);
  });
});