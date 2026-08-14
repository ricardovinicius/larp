import { beforeEach, describe, expect, it } from "vitest";
import { getStoredTheme, storeTheme } from "./theme";

describe("theme preferences", () => {
	beforeEach(() => {
		const values = new Map<string, string>();
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			value: {
				getItem: (key: string) => values.get(key) ?? null,
				setItem: (key: string, value: string) => values.set(key, value),
			},
		});
		document.documentElement.classList.remove("dark");
	});

	it("defaults to dark mode", () => {
		expect(getStoredTheme()).toBe("dark");
	});

	it("persists and applies an explicit theme", () => {
		storeTheme("light");
		expect(getStoredTheme()).toBe("light");
		expect(document.documentElement).not.toHaveClass("dark");

		storeTheme("dark");
		expect(document.documentElement).toHaveClass("dark");
	});
});
