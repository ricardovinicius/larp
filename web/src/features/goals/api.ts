import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "#/lib/api";

export interface GoalProgress {
	completed_tasks: number;
	total_tasks: number;
	percentage: number;
}

export interface Goal {
	id: string;
	title: string;
	description: string;
	due_date: string | null;
	created_at: string;
	updated_at: string;
	progress: GoalProgress;
}

export interface GoalInput {
	title: string;
	description: string;
	due_date: string | null;
}

export const goalKeys = {
	all: ["goals"] as const,
	detail: (goalId: string) => ["goals", goalId] as const,
};

export function goalsQueryOptions() {
	return queryOptions({
		queryKey: goalKeys.all,
		queryFn: () => apiRequest<Array<Goal>>("/api/v1/goals"),
	});
}

export function goalQueryOptions(goalId: string) {
	return queryOptions({
		queryKey: goalKeys.detail(goalId),
		queryFn: () => apiRequest<Goal>(`/api/v1/goals/${goalId}`),
	});
}

export function createGoal(input: GoalInput): Promise<Goal> {
	return apiRequest("/api/v1/goals", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function updateGoal(goalId: string, input: GoalInput): Promise<Goal> {
	return apiRequest(`/api/v1/goals/${goalId}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export function deleteGoal(goalId: string): Promise<void> {
	return apiRequest(`/api/v1/goals/${goalId}`, { method: "DELETE" });
}
