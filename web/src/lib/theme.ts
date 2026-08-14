export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "larp-theme";

export function getStoredTheme(): Theme {
	try {
		return window.localStorage.getItem(THEME_STORAGE_KEY) === "light"
			? "light"
			: "dark";
	} catch {
		return "dark";
	}
}

export function applyTheme(theme: Theme): void {
	document.documentElement.classList.toggle("dark", theme === "dark");
	document.documentElement.style.colorScheme = theme;
}

export function storeTheme(theme: Theme): void {
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// The theme still applies for this page when storage is unavailable.
	}
	applyTheme(theme);
}
