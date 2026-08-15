import {
	ChevronDown,
	ChevronUp,
	GripVertical,
	ListChecks,
	Pencil,
	Plus,
	Target,
	Trash2,
} from "lucide-react";
import type { Goal } from "#/features/goals/api";
import type { Task, TaskStatus } from "../api";
import { taskStatusLabels } from "../api";

const taskStatusClass: Record<TaskStatus, string> = {
	BACKLOG: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
	TODO: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
	DOING: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
	DONE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	CLOSED: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};

interface TaskItemProps {
	task: Task;
	goals: Array<Goal>;
	compact?: boolean;
	nested?: boolean;
	showStatus?: boolean;
	onEdit: (task: Task) => void;
	onAddSubtask: (task: Task) => void;
	onStatus: (
		task: Task,
		status: TaskStatus,
		position?: number,
	) => Promise<void>;
	onDelete: (task: Task) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
}

export function TaskItem({
	task,
	goals,
	compact = false,
	nested = false,
	showStatus = true,
	onEdit,
	onAddSubtask,
	onStatus,
	onDelete,
	onMoveUp,
	onMoveDown,
}: TaskItemProps) {
	const goal = goals.find((item) => item.id === task.goal_id);
	const actionClass = compact
		? "grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
		: "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2";

	return (
		<article
			className={`group text-card-foreground transition ${compact ? "rounded-xl border bg-background/75 p-3 shadow-sm hover:border-primary/30 hover:shadow-md" : `px-4 py-4 hover:bg-muted/30 sm:px-5 ${nested ? "py-3.5" : ""}`}`}
		>
			<div
				className={
					compact
						? "flex items-start gap-2"
						: "flex flex-col gap-3 sm:flex-row sm:items-start"
				}
			>
				{compact ? (
					<GripVertical
						aria-hidden="true"
						className="mt-0.5 size-4 shrink-0 text-muted-foreground/40"
					/>
				) : null}
				<div className={`min-w-0 flex-1 ${compact ? "" : "pt-0.5"}`}>
					<h3
						className={`break-words font-semibold leading-snug ${compact ? "text-sm" : nested ? "text-sm" : "text-[15px]"}`}
					>
						{task.title}
					</h3>
					{task.description && !compact ? (
						<p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
							{task.description}
						</p>
					) : null}
					{goal || task.total_subtasks > 0 ? (
						<div
							className={`${compact ? "mt-2" : "mt-2.5"} flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground`}
						>
							{goal ? (
								<span className="inline-flex max-w-full items-center gap-1.5 text-primary/80">
									{compact ? null : (
										<Target aria-hidden="true" className="size-3.5 shrink-0" />
									)}
									{goal.title}
								</span>
							) : null}
							{task.total_subtasks > 0 ? (
								<span className="inline-flex items-center gap-1.5">
									{compact ? null : (
										<ListChecks aria-hidden="true" className="size-3.5" />
									)}
									{task.completed_subtasks}/{task.total_subtasks} subtasks
								</span>
							) : null}
						</div>
					) : null}
				</div>
				{showStatus && compact ? (
					<select
						aria-label={`Status for ${task.title}`}
						className="ml-auto max-w-28 shrink-0 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground outline-none transition hover:text-foreground focus:ring-2 focus:ring-ring"
						onChange={(event) => {
							void onStatus(task, event.target.value as TaskStatus).catch(
								() => undefined,
							);
						}}
						value={task.status}
					>
						{Object.entries(taskStatusLabels).map(([status, label]) => (
							<option key={status} value={status}>
								{label}
							</option>
						))}
					</select>
				) : null}
				{!compact ? (
					<div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-1 sm:ml-auto sm:w-auto">
						{showStatus ? (
							<select
								aria-label={`Status for ${task.title}`}
								className={`mr-1 max-w-28 rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-ring ${taskStatusClass[task.status]}`}
								onChange={(event) => {
									void onStatus(task, event.target.value as TaskStatus).catch(
										() => undefined,
									);
								}}
								value={task.status}
							>
								{Object.entries(taskStatusLabels).map(([status, label]) => (
									<option key={status} value={status}>
										{label}
									</option>
								))}
							</select>
						) : null}
						<div className="flex">
							<button
								aria-label={`Edit ${task.title}`}
								className={actionClass}
								onClick={() => onEdit(task)}
								title="Edit task"
								type="button"
							>
								<Pencil aria-hidden="true" className="size-3.5" />
							</button>
							{task.parent_id === null ? (
								<button
									aria-label="Add subtask"
									className={actionClass}
									onClick={() => onAddSubtask(task)}
									title="Add subtask"
									type="button"
								>
									<Plus aria-hidden="true" className="size-4" />
								</button>
							) : null}
							<button
								aria-label={`Delete ${task.title}`}
								className={`${actionClass} hover:bg-destructive/10 hover:text-destructive`}
								onClick={() => onDelete(task)}
								title="Delete task"
								type="button"
							>
								<Trash2 aria-hidden="true" className="size-3.5" />
							</button>
						</div>
					</div>
				) : null}
			</div>
			{compact ? (
				<div className="mt-3 flex items-center gap-1 border-t pt-2">
					<button
						aria-label={`Edit ${task.title}`}
						className={actionClass}
						onClick={() => onEdit(task)}
						type="button"
					>
						<Pencil aria-hidden="true" className="size-3.5" />
						{compact ? null : <span>Edit</span>}
					</button>
					{task.parent_id === null ? (
						<button
							aria-label="Add subtask"
							className={actionClass}
							onClick={() => onAddSubtask(task)}
							type="button"
						>
							<Plus aria-hidden="true" className="size-3.5" />
							{compact ? null : <span>Add subtask</span>}
						</button>
					) : null}
					{onMoveUp ? (
						<button
							aria-label={`Move ${task.title} up`}
							className={actionClass}
							onClick={onMoveUp}
							type="button"
						>
							<ChevronUp aria-hidden="true" className="size-4" />
						</button>
					) : null}
					{onMoveDown ? (
						<button
							aria-label={`Move ${task.title} down`}
							className={actionClass}
							onClick={onMoveDown}
							type="button"
						>
							<ChevronDown aria-hidden="true" className="size-4" />
						</button>
					) : null}
					<button
						aria-label={`Delete ${task.title}`}
						className={`${actionClass} ml-auto text-destructive/80 hover:bg-destructive/10 hover:text-destructive`}
						onClick={() => onDelete(task)}
						type="button"
					>
						<Trash2 aria-hidden="true" className="size-3.5" />
					</button>
				</div>
			) : null}
		</article>
	);
}
