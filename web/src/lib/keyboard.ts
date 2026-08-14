export function acceptsKeyboardShortcut(event: KeyboardEvent) {
	if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
		return false;

	const target = event.target;
	if (!(target instanceof HTMLElement)) return true;

	return !(
		["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
		target.isContentEditable
	);
}
