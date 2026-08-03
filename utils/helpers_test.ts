import { assertEquals } from "@std/assert";
import { comparePrices, getCurrentMonth } from "./helpers.ts";

// Note: per the current implementation, `change` is derived from
// `currData[key] - prevData[key]`, labelling a positive diff (price went up)
// as "down" and a negative diff (price went down) as "up".
Deno.test("comparePrices() labels a price increase and computes the absolute diff", () => {
    const prevMonth = { id: 1, month: "2024-01", _95_ulp: 20.5, diesel_005: 18.0 };
    const currMonth = { id: 2, month: "2024-02", _95_ulp: 21.75, diesel_005: 18.0 };

    const changes = comparePrices([prevMonth, currMonth]);

    const ulpChange = changes.find((c) => c.id === "_95_ulp");
    assertEquals(ulpChange?.price, "1.25");
    assertEquals(ulpChange?.change, "down");
    assertEquals(ulpChange?.name, "95 ULP (c/l)");
});

Deno.test("comparePrices() labels a price decrease", () => {
    const prevMonth = { id: 1, month: "2024-01", diesel_005: 20.0 };
    const currMonth = { id: 2, month: "2024-02", diesel_005: 18.5 };

    const changes = comparePrices([prevMonth, currMonth]);

    const dieselChange = changes.find((c) => c.id === "diesel_005");
    assertEquals(dieselChange?.price, "1.50");
    assertEquals(dieselChange?.change, "up");
});

Deno.test("comparePrices() excludes the 'id' and 'month' columns from the results", () => {
    const prevMonth = { id: 1, month: "2024-01", diesel_005: 20.0 };
    const currMonth = { id: 2, month: "2024-02", diesel_005: 18.5 };

    const changes = comparePrices([prevMonth, currMonth]);

    assertEquals(changes.some((c) => c.id === "id"), false);
    assertEquals(changes.some((c) => c.id === "month"), false);
    assertEquals(changes.length, 1);
});

Deno.test("getCurrentMonth() defaults to the current month in 'YYYY-MM' format", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;

    assertEquals(getCurrentMonth(), expected);
});

Deno.test("getCurrentMonth() applies the provided month offset", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${(now.getMonth()).toString().padStart(2, "0")}`;

    assertEquals(getCurrentMonth(0), expected);
});
