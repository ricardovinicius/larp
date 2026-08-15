export type TaskView = "kanban" | "list";

const TASK_VIEW_STORAGE_KEY = "larp-task-view";

export function getStoredTaskView(): TaskView {
	try {
		return window.localStorage.getItem(TASK_VIEW_STORAGE_KEY) === "kanban"
			? "kanban"
			: "list";
	} catch {
		return "list";
	}
}

export function storeTaskView(view: TaskView): void {
	try {
		window.localStorage.setItem(TASK_VIEW_STORAGE_KEY, view);
	} catch {
		// The selected view still applies for this page when storage is unavailable.
	}
}
