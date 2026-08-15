import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Keyboard, ListChecks, Moon, Sun, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "#/components/modal";
import { ShortcutKey } from "#/components/shortcut-key";
import { acceptsKeyboardShortcut } from "#/lib/keyboard";
import { getStoredTheme, storeTheme } from "#/lib/theme";

import "../styles.css";

export const Route = createRootRoute({
	component: RootComponent,
	notFoundComponent: () => (
		<div className="mx-auto max-w-2xl p-8 text-center">
			<h1 className="text-3xl font-bold">Page not found</h1>
			<p className="mt-3 text-muted-foreground">
				The page you requested does not exist.
			</p>
			<Link className="button-primary mt-6" to="/goals">
				Back to goals
			</Link>
		</div>
	),
});

function ThemeToggle() {
	const [theme, setTheme] = useState(getStoredTheme);
	const isDark = theme === "dark";

	return (
		<button
			aria-checked={isDark}
			aria-label={`Dark mode ${isDark ? "on" : "off"}`}
			className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:justify-start"
			onClick={() => {
				const nextTheme = isDark ? "light" : "dark";
				storeTheme(nextTheme);
				setTheme(nextTheme);
			}}
			role="switch"
			title={isDark ? "Switch to light mode" : "Switch to dark mode"}
			type="button"
		>
			{isDark ? (
				<Moon aria-hidden="true" className="size-5 shrink-0" />
			) : (
				<Sun aria-hidden="true" className="size-5 shrink-0" />
			)}
			<span className="hidden sm:inline">
				{isDark ? "Dark mode" : "Light mode"}
			</span>
			<span
				aria-hidden="true"
				className={`ml-auto hidden h-5 w-9 rounded-full p-0.5 transition sm:block ${isDark ? "bg-primary" : "bg-muted-foreground/30"}`}
			>
				<span
					className={`block size-4 rounded-full bg-white shadow-sm transition-transform ${isDark ? "translate-x-4" : "translate-x-0"}`}
				/>
			</span>
		</button>
	);
}

function RootComponent() {
	const navigate = useNavigate();
	const [shortcutsOpen, setShortcutsOpen] = useState(false);

	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			if (!acceptsKeyboardShortcut(event)) return;

			if (shortcutsOpen) {
				if (event.key === "?") setShortcutsOpen(false);
				return;
			}
			if (document.querySelector('[role="dialog"]')) return;

			switch (event.key.toLowerCase()) {
				case "g":
					event.preventDefault();
					void navigate({ to: "/goals" });
					break;
				case "t":
					event.preventDefault();
					void navigate({
						to: "/tasks",
						search: { closed: false },
					});
					break;
				case "?":
					event.preventDefault();
					setShortcutsOpen(true);
					break;
			}
		};

		window.addEventListener("keydown", handleShortcut);
		return () => window.removeEventListener("keydown", handleShortcut);
	}, [navigate, shortcutsOpen]);

	return (
		<>
			<div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
				<aside className="fixed inset-y-0 left-0 z-40 flex w-20 flex-col border-r bg-background/90 px-3 py-5 shadow-[8px_0_30px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:w-60 sm:px-4 sm:py-6">
					<Link
						aria-label="LARP goals"
						className="flex items-center justify-center gap-3 sm:justify-start sm:px-2"
						to="/goals"
					>
						<span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-sm">
							L
						</span>
						<span className="hidden text-xl font-black tracking-tight sm:inline">
							LARP
						</span>
					</Link>

					<div className="mt-10 hidden px-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground sm:block">
						Plan
					</div>
					<nav
						aria-label="Primary navigation"
						className="mt-3 flex flex-col gap-2"
					>
						<Link
							activeOptions={{ includeSearch: false }}
							activeProps={{
								className: "bg-primary/10 text-primary",
							}}
							className="flex min-h-12 items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:justify-start"
							title="Goals"
							to="/goals"
						>
							<Target aria-hidden="true" className="size-5 shrink-0" />
							<span className="hidden sm:inline">Goals</span>
							<ShortcutKey className="ml-auto hidden sm:inline-flex">
								G
							</ShortcutKey>
						</Link>
						<Link
							activeOptions={{ includeSearch: false }}
							activeProps={{
								className: "bg-primary/10 text-primary",
							}}
							className="flex min-h-12 items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:justify-start"
							search={{ closed: false }}
							title="Tasks"
							to="/tasks"
						>
							<ListChecks aria-hidden="true" className="size-5 shrink-0" />
							<span className="hidden sm:inline">Tasks</span>
							<ShortcutKey className="ml-auto hidden sm:inline-flex">
								T
							</ShortcutKey>
						</Link>
					</nav>

					<div className="mt-auto space-y-1 border-t pt-3">
						<button
							className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:justify-start"
							onClick={() => setShortcutsOpen(true)}
							title="Keyboard shortcuts"
							type="button"
						>
							<Keyboard aria-hidden="true" className="size-5 shrink-0" />
							<span className="hidden sm:inline">Shortcuts</span>
							<ShortcutKey className="ml-auto hidden sm:inline-flex">
								?
							</ShortcutKey>
						</button>
						<ThemeToggle />
					</div>
				</aside>
				<div className="min-h-screen pl-20 sm:pl-60">
					<main className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-8 lg:py-12">
						<Outlet />
					</main>
				</div>
			</div>
			{shortcutsOpen ? (
				<Modal
					onClose={() => setShortcutsOpen(false)}
					title="Keyboard shortcuts"
				>
					<div className="space-y-6">
						<ShortcutGroup
							items={[
								["G", "Go to goals"],
								["T", "Go to tasks"],
								["?", "Show or hide this guide"],
							]}
							title="Anywhere"
						/>
						<ShortcutGroup
							items={[
								["N", "Create a new task"],
								["V", "Switch list or Kanban view"],
								["C", "Toggle closed tasks"],
							]}
							title="Tasks"
						/>
						<p className="border-t pt-4 text-xs text-muted-foreground">
							Shortcuts pause while you are typing. Press{" "}
							<ShortcutKey>Esc</ShortcutKey> to close a dialog.
						</p>
					</div>
				</Modal>
			) : null}
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "TanStack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
		</>
	);
}

function ShortcutGroup({
	title,
	items,
}: {
	title: string;
	items: Array<[key: string, label: string]>;
}) {
	return (
		<section>
			<h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
				{title}
			</h3>
			<div className="overflow-hidden rounded-xl border bg-card/60">
				{items.map(([key, label]) => (
					<div
						className="flex items-center justify-between gap-4 border-b px-4 py-3 text-sm last:border-b-0"
						key={key}
					>
						<span>{label}</span>
						<ShortcutKey>{key}</ShortcutKey>
					</div>
				))}
			</div>
		</section>
	);
}
