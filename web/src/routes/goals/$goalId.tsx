import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "#/components/modal";
import {
	deleteGoal,
	type GoalInput,
	goalKeys,
	goalQueryOptions,
	updateGoal,
} from "#/features/goals/api";
import { GoalForm } from "#/features/goals/components/goal-form";
import { GoalProgress } from "#/features/goals/components/goal-progress";
import {
	createTask,
	deleteTask,
	type Task,
	type TaskInput,
	type TaskStatus,
	taskKeys,
	tasksQueryOptions,
	updateTask,
} from "#/features/tasks/api";
import { TaskForm } from "#/features/tasks/components/task-form";
import { TaskList } from "#/features/tasks/components/task-list";
import { ApiError, errorMessage } from "#/lib/api";

export const Route = createFileRoute("/goals/$goalId")({
	component: GoalDetailPage,
});

interface TaskDialogState {
	task?: Task;
	parent?: Task;
}

function isOverdue(value: string): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return new Date(`${value}T00:00:00`) < today;
}

function GoalDetailPage() {
	const { goalId } = Route.useParams();
	const navigate = useNavigate({ from: "/goals/$goalId" });
	const queryClient = useQueryClient();
	const [editingGoal, setEditingGoal] = useState(false);
	const [taskDialog, setTaskDialog] = useState<TaskDialogState>();
	const [includeClosed, setIncludeClosed] = useState(false);
	const goalQuery = useQuery(goalQueryOptions(goalId));
	const tasksQuery = useQuery(tasksQueryOptions({ goalId, includeClosed }));

	const refresh = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: goalKeys.all }),
			queryClient.invalidateQueries({ queryKey: taskKeys.all }),
		]);
	};
	const goalUpdateMutation = useMutation({
		mutationFn: (input: GoalInput) => updateGoal(goalId, input),
		onSuccess: async () => {
			await refresh();
			setEditingGoal(false);
		},
	});
	const goalDeleteMutation = useMutation({
		mutationFn: () => deleteGoal(goalId),
		onSuccess: async () => {
			await refresh();
			await navigate({ to: "/goals" });
		},
	});
	const taskCreateMutation = useMutation({
		mutationFn: createTask,
		onSuccess: refresh,
	});
	const taskUpdateMutation = useMutation({
		mutationFn: ({
			taskId,
			input,
		}: {
			taskId: string;
			input: Parameters<typeof updateTask>[1];
		}) => updateTask(taskId, input),
		onSuccess: refresh,
	});
	const taskDeleteMutation = useMutation({
		mutationFn: deleteTask,
		onSuccess: refresh,
	});
	const mutationError =
		goalDeleteMutation.error ??
		taskCreateMutation.error ??
		taskUpdateMutation.error ??
		taskDeleteMutation.error;

	if (goalQuery.isPending) {
		return (
			<p className="rounded-2xl border bg-card p-8 text-muted-foreground">
				Loading goal…
			</p>
		);
	}
	if (goalQuery.isError) {
		const notFound =
			goalQuery.error instanceof ApiError && goalQuery.error.status === 404;
		return (
			<div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
				<h1 className="text-2xl font-bold">
					{notFound ? "Goal not found" : "Could not load goal"}
				</h1>
				<p className="mt-3 text-muted-foreground">
					{errorMessage(goalQuery.error)}
				</p>
				<Link className="button-primary mt-6" to="/goals">
					Back to goals
				</Link>
			</div>
		);
	}

	const goal = goalQuery.data;
	return (
		<section>
			<Link
				className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
				to="/goals"
			>
				<ArrowLeft aria-hidden="true" className="size-4" /> All goals
			</Link>
			<div className="mb-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
				<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
					<div className="max-w-3xl">
						<h1 className="text-3xl font-black tracking-tight sm:text-4xl">
							{goal.title}
						</h1>
						{goal.description ? (
							<p className="mt-4 whitespace-pre-wrap text-muted-foreground">
								{goal.description}
							</p>
						) : null}
						{goal.due_date ? (
							<p
								className={`mt-4 flex items-center gap-2 text-sm ${isOverdue(goal.due_date) ? "font-medium text-destructive" : "text-muted-foreground"}`}
							>
								<Calendar aria-hidden="true" className="size-4" />
								{isOverdue(goal.due_date) ? "Overdue · " : "Due "}
								{goal.due_date}
							</p>
						) : null}
					</div>
					<div className="flex gap-2">
						<button
							className="button-secondary gap-2"
							onClick={() => setEditingGoal(true)}
							type="button"
						>
							<Pencil aria-hidden="true" className="size-4" /> Edit
						</button>
						<button
							aria-label="Delete goal"
							className="button-secondary text-destructive"
							onClick={() => {
								if (
									window.confirm(
										"Permanently delete this goal? Its tasks will be kept as unassigned tasks.",
									)
								) {
									goalDeleteMutation.mutate();
								}
							}}
							type="button"
						>
							<Trash2 aria-hidden="true" className="size-4" />
						</button>
					</div>
				</div>
				<div className="mt-8 max-w-xl">
					<GoalProgress progress={goal.progress} />
				</div>
			</div>

			<header className="mb-5 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold">Tasks</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Work contributing to this goal.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<label className="flex items-center gap-2 text-sm text-muted-foreground">
						<input
							checked={includeClosed}
							onChange={(event) => setIncludeClosed(event.target.checked)}
							type="checkbox"
						/>
						Include closed
					</label>
					<button
						className="button-primary gap-2"
						onClick={() => setTaskDialog({})}
						type="button"
					>
						<Plus aria-hidden="true" className="size-4" /> Add task
					</button>
				</div>
			</header>

			{mutationError ? (
				<p
					className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
					role="alert"
				>
					{errorMessage(mutationError)}
				</p>
			) : null}
			{tasksQuery.isPending ? (
				<p className="rounded-2xl border bg-card p-8 text-muted-foreground">
					Loading tasks…
				</p>
			) : tasksQuery.isError ? (
				<div className="rounded-2xl border bg-card p-6" role="alert">
					<p className="text-destructive">{errorMessage(tasksQuery.error)}</p>
					<button
						className="button-secondary mt-3"
						onClick={() => void tasksQuery.refetch()}
						type="button"
					>
						Retry
					</button>
				</div>
			) : tasksQuery.data.length === 0 ? (
				<div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-muted-foreground">
					No tasks contribute to this goal yet.
				</div>
			) : (
				<TaskList
					goals={[goal]}
					onAddSubtask={(task) => setTaskDialog({ parent: task })}
					onDelete={(task) => {
						if (window.confirm(`Permanently delete “${task.title}”?`))
							taskDeleteMutation.mutate(task.id);
					}}
					onEdit={(task) => setTaskDialog({ task })}
					onStatus={async (
						task: Task,
						status: TaskStatus,
						position?: number,
					) => {
						await taskUpdateMutation.mutateAsync({
							taskId: task.id,
							input: { status, position },
						});
					}}
					tasks={tasksQuery.data}
				/>
			)}

			{editingGoal ? (
				<Modal onClose={() => setEditingGoal(false)} title="Edit goal">
					<GoalForm
						goal={goal}
						onCancel={() => setEditingGoal(false)}
						onSubmit={(input) =>
							goalUpdateMutation.mutateAsync(input).then(() => undefined)
						}
					/>
				</Modal>
			) : null}
			{taskDialog ? (
				<Modal
					onClose={() => setTaskDialog(undefined)}
					title={
						taskDialog.task
							? "Edit task"
							: taskDialog.parent
								? "Add subtask"
								: "Add task"
					}
				>
					<TaskForm
						defaultGoalId={goal.id}
						goals={[goal]}
						onCancel={() => setTaskDialog(undefined)}
						onSubmit={async (input: TaskInput) => {
							if (taskDialog.task) {
								await taskUpdateMutation.mutateAsync({
									taskId: taskDialog.task.id,
									input,
								});
							} else {
								await taskCreateMutation.mutateAsync(input);
							}
							setTaskDialog(undefined);
						}}
						parent={taskDialog.parent}
						task={taskDialog.task}
					/>
				</Modal>
			) : null}
		</section>
	);
}
