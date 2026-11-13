import { expect, test } from "bun:test";
import { CHAPA_CHECKOUT_ENABLED } from "./policy";
test("new Chapa checkouts are paused", () => expect(CHAPA_CHECKOUT_ENABLED).toBe(false));