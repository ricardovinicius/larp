import { useState } from "react";
import type { Goal } from "#/features/goals/api";
import { errorMessage } from "#/lib/api";
import {
	type Task,
	type TaskInput,
	taskStatuses,
	taskStatusLabels,
} from "../api";

interface TaskFormProps {
	goals: Array<Goal>;
	task?: Task;
	parent?: Task;
	defaultGoalId?: string;
	onSubmit: (input: TaskInput) => Promise<void>;
	onCancel: () => void;
}

export function TaskForm({
	goals,
	task,
	parent,
	defaultGoalId,
	onSubmit,
	onCancel,
}: TaskFormProps) {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string>();
	const isSubtask = Boolean(parent ?? task?.parent_id);

	return (
		<form
			className="space-y-5"
			onSubmit={async (event) => {
				event.preventDefault();
				setPending(true);
				setError(undefined);
				const data = new FormData(event.currentTarget);
				const input: TaskInput = {
					title: String(data.get("title") ?? ""),
					description: String(data.get("description") ?? ""),
					status: String(data.get("status")) as TaskInput["status"],
				};
				if (parent) {
					input.parent_id = parent.id;
				} else if (!isSubtask) {
					input.goal_id = String(data.get("goal_id") ?? "") || null;
				}
				try {
					await onSubmit(input);
				} catch (submissionError) {
					setError(errorMessage(submissionError));
				} finally {
					setPending(false);
				}
			}}
		>
			<label className="grid gap-2 font-medium">
				Title
				<input
					className="rounded-xl border bg-background px-3 py-2 font-normal"
					defaultValue={task?.title}
					maxLength={200}
					name="title"
					required
				/>
			</label>
			<label className="grid gap-2 font-medium">
				Description
				<textarea
					className="min-h-28 resize-y rounded-xl border bg-background px-3 py-2 font-normal"
					defaultValue={task?.description}
					maxLength={10000}
					name="description"
				/>
			</label>
			<div className="grid gap-4 sm:grid-cols-2">
				<label className="grid gap-2 font-medium">
					Status
					<select
						className="rounded-xl border bg-background px-3 py-2 font-normal"
						defaultValue={task?.status ?? "BACKLOG"}
						name="status"
					>
						{taskStatuses.map((status) => (
							<option key={status} value={status}>
								{taskStatusLabels[status]}
							</option>
						))}
					</select>
				</label>
				{isSubtask ? (
					<div className="grid gap-2 font-medium">
						Goal
						<p className="rounded-xl border bg-muted/40 px-3 py-2 font-normal text-muted-foreground">
							Inherited from parent task
						</p>
					</div>
				) : (
					<label className="grid gap-2 font-medium">
						Goal
						<select
							className="rounded-xl border bg-background px-3 py-2 font-normal"
							defaultValue={task?.goal_id ?? defaultGoalId ?? ""}
							name="goal_id"
						>
							<option value="">Unassigned</option>
							{goals.map((goal) => (
								<option key={goal.id} value={goal.id}>
									{goal.title}
								</option>
							))}
						</select>
					</label>
				)}
			</div>
			{error ? (
				<p
					className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
					role="alert"
				>
					{error}
				</p>
			) : null}
			<div className="flex justify-end gap-3">
				<button className="button-secondary" onClick={onCancel} type="button">
					Cancel
				</button>
				<button className="button-primary" disabled={pending} type="submit">
					{pending ? "Saving…" : task ? "Save changes" : "Create task"}
				</button>
			</div>
		</form>
	);
}
