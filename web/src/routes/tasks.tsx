import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Columns3, List, Plus, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Modal } from "#/components/modal";
import { ShortcutKey } from "#/components/shortcut-key";
import { goalKeys, goalsQueryOptions } from "#/features/goals/api";
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
import { TaskBoard } from "#/features/tasks/components/task-board";
import { TaskForm } from "#/features/tasks/components/task-form";
import { TaskList } from "#/features/tasks/components/task-list";
import { errorMessage } from "#/lib/api";
import { acceptsKeyboardShortcut } from "#/lib/keyboard";

const taskSearchSchema = z.object({
	view: z.enum(["list", "kanban"]).catch("list").default("list"),
	goal: z.string().optional().catch(undefined),
	closed: z
		.preprocess((value) => value === true || value === "true", z.boolean())
		.catch(false),
});

export const Route = createFileRoute("/tasks")({
	validateSearch: taskSearchSchema,
	component: TasksPage,
});

interface TaskDialogState {
	task?: Task;
	parent?: Task;
}

function TasksPage() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: "/tasks" });
	const queryClient = useQueryClient();
	const [taskDialog, setTaskDialog] = useState<TaskDialogState>();
	const goalsQuery = useQuery(goalsQueryOptions());
	const taskFilters = {
		goalId:
			search.goal && search.goal !== "unassigned" ? search.goal : undefined,
		unassigned: search.goal === "unassigned",
		includeClosed: search.closed,
	};
	const tasksQuery = useQuery(tasksQueryOptions(taskFilters));

	const refresh = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: taskKeys.all }),
			queryClient.invalidateQueries({ queryKey: goalKeys.all }),
		]);
	};
	const createMutation = useMutation({
		mutationFn: createTask,
		onSuccess: refresh,
	});
	const updateMutation = useMutation({
		mutationFn: ({
			taskId,
			input,
		}: {
			taskId: string;
			input: Parameters<typeof updateTask>[1];
		}) => updateTask(taskId, input),
		onSuccess: refresh,
	});
	const deleteMutation = useMutation({
		mutationFn: deleteTask,
		onSuccess: refresh,
	});
	const mutationError =
		createMutation.error ?? updateMutation.error ?? deleteMutation.error;
	const goals = goalsQuery.data ?? [];
	const tasks = tasksQuery.data ?? [];

	const changeStatus = async (
		task: Task,
		status: TaskStatus,
		position?: number,
	) => {
		await updateMutation.mutateAsync({
			taskId: task.id,
			input: { status, ...(position === undefined ? {} : { position }) },
		});
	};

	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			if (taskDialog || !acceptsKeyboardShortcut(event)) return;

			switch (event.key.toLowerCase()) {
				case "n":
					event.preventDefault();
					setTaskDialog({});
					break;
				case "v":
					event.preventDefault();
					void navigate({
						search: (previous) => ({
							...previous,
							view: previous.view === "list" ? "kanban" : "list",
						}),
					});
					break;
				case "c":
					event.preventDefault();
					void navigate({
						search: (previous) => ({
							...previous,
							closed: !previous.closed,
						}),
					});
					break;
			}
		};

		window.addEventListener("keydown", handleShortcut);
		return () => window.removeEventListener("keydown", handleShortcut);
	}, [navigate, taskDialog]);

	return (
		<section className="min-w-0">
			<header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
				<div>
					<p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
						Your next moves
					</p>
					<h1 className="text-4xl font-black tracking-tight sm:text-5xl">
						Tasks
					</h1>
					<p className="mt-3 text-muted-foreground">
						Capture work, choose what is next, and keep it moving.
					</p>
				</div>
				<button
					className="button-primary gap-2"
					onClick={() => setTaskDialog({})}
					title="New task (N)"
					type="button"
				>
					<Plus aria-hidden="true" className="size-4" /> New task
					<ShortcutKey className="ml-1 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
						N
					</ShortcutKey>
				</button>
			</header>

			<div className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border bg-card/70 p-2.5 shadow-sm backdrop-blur sm:flex-row sm:items-center">
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2 rounded-xl bg-background/60 px-2.5 py-1.5">
						<SlidersHorizontal
							aria-hidden="true"
							className="size-4 text-muted-foreground"
						/>
						<label>
							<span className="sr-only">Filter by goal</span>
							<select
								className="rounded-lg border-0 bg-transparent py-1 pr-2 text-sm font-medium outline-none"
								onChange={(event) =>
									void navigate({
										search: (previous) => ({
											...previous,
											goal: event.target.value || undefined,
										}),
									})
								}
								value={search.goal ?? ""}
							>
								<option value="">All goals</option>
								<option value="unassigned">Unassigned</option>
								{goals.map((goal) => (
									<option key={goal.id} value={goal.id}>
										{goal.title}
									</option>
								))}
							</select>
						</label>
					</div>
					<label className="flex items-center gap-2 text-sm text-muted-foreground">
						<input
							className="size-4 accent-primary"
							checked={search.closed}
							onChange={(event) =>
								void navigate({
									search: (previous) => ({
										...previous,
										closed: event.target.checked,
									}),
								})
							}
							type="checkbox"
						/>
						Include closed
						<ShortcutKey>C</ShortcutKey>
					</label>
				</div>
				<div className="flex items-center gap-3">
					<span className="hidden text-xs font-medium text-muted-foreground md:inline">
						{tasks.length} {tasks.length === 1 ? "task" : "tasks"}
					</span>
					<fieldset
						aria-label="Task view"
						className="flex rounded-xl bg-muted/80 p-1"
					>
						<legend className="sr-only">Task view</legend>
						<button
							aria-pressed={search.view === "list"}
							className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${search.view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
							onClick={() =>
								void navigate({
									search: (previous) => ({ ...previous, view: "list" }),
								})
							}
							type="button"
							title="List view (V)"
						>
							<List aria-hidden="true" className="size-4" /> List
						</button>
						<button
							aria-pressed={search.view === "kanban"}
							className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${search.view === "kanban" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
							onClick={() =>
								void navigate({
									search: (previous) => ({ ...previous, view: "kanban" }),
								})
							}
							type="button"
							title="Kanban view (V)"
						>
							<Columns3 aria-hidden="true" className="size-4" /> Kanban
						</button>
					</fieldset>
				</div>
			</div>

			{mutationError ? (
				<p
					className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
					role="alert"
				>
					{errorMessage(mutationError)}
				</p>
			) : null}
			{tasksQuery.isPending || goalsQuery.isPending ? (
				<p className="rounded-2xl border bg-card p-8 text-muted-foreground">
					Loading tasks…
				</p>
			) : tasksQuery.isError || goalsQuery.isError ? (
				<div className="rounded-2xl border bg-card p-6" role="alert">
					<p className="text-destructive">
						{errorMessage(tasksQuery.error ?? goalsQuery.error)}
					</p>
					<button
						className="button-secondary mt-3"
						onClick={() => {
							void tasksQuery.refetch();
							void goalsQuery.refetch();
						}}
						type="button"
					>
						Retry
					</button>
				</div>
			) : tasks.length === 0 ? (
				<div className="rounded-3xl border border-dashed bg-card/50 p-14 text-center">
					<h2 className="text-xl font-bold">No tasks here</h2>
					<p className="mt-2 text-muted-foreground">
						Create a task or change the current filters.
					</p>
					<button
						className="button-primary mt-5"
						onClick={() => setTaskDialog({})}
						type="button"
					>
						Create task
					</button>
				</div>
			) : search.view === "kanban" ? (
				<TaskBoard
					goals={goals}
					includeClosed={search.closed}
					onAddSubtask={(task) => setTaskDialog({ parent: task })}
					onDelete={(task) => {
						if (window.confirm(`Permanently delete “${task.title}”?`))
							deleteMutation.mutate(task.id);
					}}
					onEdit={(task) => setTaskDialog({ task })}
					onStatus={changeStatus}
					tasks={tasks}
				/>
			) : (
				<TaskList
					goals={goals}
					onAddSubtask={(task) => setTaskDialog({ parent: task })}
					onDelete={(task) => {
						if (window.confirm(`Permanently delete “${task.title}”?`))
							deleteMutation.mutate(task.id);
					}}
					onEdit={(task) => setTaskDialog({ task })}
					onStatus={changeStatus}
					tasks={tasks}
				/>
			)}

			{taskDialog ? (
				<Modal
					onClose={() => setTaskDialog(undefined)}
					title={
						taskDialog.task
							? "Edit task"
							: taskDialog.parent
								? "Add subtask"
								: "Create task"
					}
				>
					<TaskForm
						defaultGoalId={taskFilters.goalId}
						goals={goals}
						onCancel={() => setTaskDialog(undefined)}
						onSubmit={async (input: TaskInput) => {
							if (taskDialog.task) {
								await updateMutation.mutateAsync({
									taskId: taskDialog.task.id,
									input,
								});
							} else {
								await createMutation.mutateAsync(input);
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
