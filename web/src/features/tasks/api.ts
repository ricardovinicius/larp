import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "#/lib/api";

export const taskStatuses = [
	"BACKLOG",
	"TODO",
	"DOING",
	"DONE",
	"CLOSED",
] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
	BACKLOG: "Backlog",
	TODO: "To Do",
	DOING: "Doing",
	DONE: "Done",
	CLOSED: "Closed",
};

export interface Task {
	id: string;
	goal_id: string | null;
	parent_id: string | null;
	title: string;
	description: string;
	status: TaskStatus;
	position: number;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
	completed_subtasks: number;
	total_subtasks: number;
}

export interface TaskInput {
	title: string;
	description: string;
	status: TaskStatus;
	goal_id?: string | null;
	parent_id?: string | null;
}

export interface TaskUpdate extends Partial<TaskInput> {
	position?: number;
}

export interface TaskFilters {
	goalId?: string;
	unassigned?: boolean;
	includeClosed?: boolean;
}

export const taskKeys = {
	all: ["tasks"] as const,
	list: (filters: TaskFilters) => ["tasks", filters] as const,
	detail: (taskId: string) => ["tasks", taskId] as const,
};

function taskListUrl(filters: TaskFilters): string {
	const search = new URLSearchParams();
	if (filters.goalId) search.set("goal_id", filters.goalId);
	if (filters.unassigned) search.set("unassigned", "true");
	if (filters.includeClosed) search.set("include_closed", "true");
	const query = search.toString();
	return `/api/v1/tasks${query ? `?${query}` : ""}`;
}

export function tasksQueryOptions(filters: TaskFilters = {}) {
	return queryOptions({
		queryKey: taskKeys.list(filters),
		queryFn: () => apiRequest<Array<Task>>(taskListUrl(filters)),
	});
}

export function createTask(input: TaskInput): Promise<Task> {
	return apiRequest("/api/v1/tasks", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function updateTask(taskId: string, input: TaskUpdate): Promise<Task> {
	return apiRequest(`/api/v1/tasks/${taskId}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export function deleteTask(taskId: string): Promise<void> {
	return apiRequest(`/api/v1/tasks/${taskId}`, { method: "DELETE" });
}
