import { describe, expect, it } from "vitest";
import { acceptsKeyboardShortcut } from "./keyboard";

function shortcutFrom(target: HTMLElement, options: KeyboardEventInit = {}) {
	let accepted = false;
	target.addEventListener(
		"keydown",
		(event) => {
			accepted = acceptsKeyboardShortcut(event);
		},
		{ once: true },
	);
	target.dispatchEvent(
		new KeyboardEvent("keydown", { bubbles: true, ...options }),
	);
	return accepted;
}

describe("keyboard shortcuts", () => {
	it("accepts an unmodified key outside editable controls", () => {
		expect(shortcutFrom(document.body, { key: "g" })).toBe(true);
	});

	it("pauses while the user is typing", () => {
		const input = document.createElement("input");
		document.body.append(input);

		expect(shortcutFrom(input, { key: "n" })).toBe(false);
		input.remove();
	});

	it("ignores modified and repeating keys", () => {
		expect(shortcutFrom(document.body, { ctrlKey: true, key: "g" })).toBe(
			false,
		);
		expect(shortcutFrom(document.body, { key: "v", repeat: true })).toBe(false);
	});
});
