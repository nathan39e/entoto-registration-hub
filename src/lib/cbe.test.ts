import { describe, expect, test } from "bun:test";
import { cbeFor } from "./cbe";
import { cbeFor as serverCbeFor } from "../../supabase/functions/_shared/cbe";
describe("CBE accounts", () => {
  test("regular uses 1000010827632 at 350 ETB", () => expect(cbeFor("Regular")).toEqual({ account: "1000010827632", amount: 350 }));
  test("weekend uses 1000010789487 at 1700 ETB", () => expect(cbeFor("Weekend")).toEqual({ account: "1000010789487", amount: 1700 }));
  test("extension uses 1000010789487 at 1700 ETB", () => expect(cbeFor("Extension")).toEqual({ account: "1000010789487", amount: 1700 }));
  test("server matches browser", () => { for (const p of ["Regular", "Weekend", "Extension", null]) expect(serverCbeFor(p)).toEqual(cbeFor(p)); });
});
