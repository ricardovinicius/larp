import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Goal } from "#/features/goals/api";
import type { Task } from "../api";
import { TaskList } from "./task-list";

const goal: Goal = {
	id: "goal-1",
	title: "Learn frontend",
	description: "",
	due_date: null,
	created_at: "2026-08-14T12:00:00Z",
	updated_at: "2026-08-14T12:00:00Z",
	progress: { completed_tasks: 0, percentage: 0, total_tasks: 2 },
};

function task(overrides: Partial<Task>): Task {
	return {
		id: "task-1",
		goal_id: goal.id,
		parent_id: null,
		title: "Build the layout",
		description: "",
		status: "TODO",
		position: 0,
		completed_at: null,
		created_at: "2026-08-14T12:00:00Z",
		updated_at: "2026-08-14T12:00:00Z",
		completed_subtasks: 0,
		total_subtasks: 1,
		...overrides,
	};
}

describe("TaskList", () => {
	it("nests subtasks and exposes an accessible status control", async () => {
		const onStatus = vi.fn(async () => undefined);
		render(
			<TaskList
				goals={[goal]}
				onAddSubtask={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
				onStatus={onStatus}
				tasks={[
					task({}),
					task({
						id: "task-2",
						parent_id: "task-1",
						title: "Style navigation",
						total_subtasks: 0,
					}),
				]}
			/>,
		);

		expect(screen.getByText("Build the layout")).toBeInTheDocument();
		expect(screen.getByText("Style navigation")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Add subtask" })).toHaveLength(
			1,
		);

		fireEvent.change(screen.getByLabelText("Status for Build the layout"), {
			target: { value: "DOING" },
		});
		await waitFor(() =>
			expect(onStatus).toHaveBeenCalledWith(expect.anything(), "DOING"),
		);
	});
});
