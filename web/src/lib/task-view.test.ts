import { beforeEach, describe, expect, it } from "vitest";
import { getStoredTaskView, storeTaskView } from "./task-view";

describe("task view preference", () => {
	beforeEach(() => {
		const values = new Map<string, string>();
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			value: {
				getItem: (key: string) => values.get(key) ?? null,
				setItem: (key: string, value: string) => values.set(key, value),
			},
		});
	});

	it("defaults to list view", () => {
		expect(getStoredTaskView()).toBe("list");
	});

	it("persists an explicit view", () => {
		storeTaskView("kanban");
		expect(getStoredTaskView()).toBe("kanban");

		storeTaskView("list");
		expect(getStoredTaskView()).toBe("list");
	});
});
