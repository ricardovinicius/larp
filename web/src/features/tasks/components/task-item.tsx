import {
	ChevronDown,
	ChevronUp,
	GripVertical,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import type { Goal } from "#/features/goals/api";
import type { Task, TaskStatus } from "../api";
import { taskStatusLabels } from "../api";

interface TaskItemProps {
	task: Task;
	goals: Array<Goal>;
	compact?: boolean;
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
		: "button-ghost gap-1.5";

	return (
		<article
			className={`group rounded-xl border text-card-foreground shadow-sm transition hover:border-primary/30 hover:shadow-md ${compact ? "bg-background/75 p-3" : "bg-card p-4"}`}
		>
			<div className="flex items-start gap-2">
				{compact ? (
					<GripVertical
						aria-hidden="true"
						className="mt-0.5 size-4 shrink-0 text-muted-foreground/40"
					/>
				) : null}
				<div className="min-w-0">
					<h3 className="break-words text-sm font-semibold leading-snug">
						{task.title}
					</h3>
					<div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
						{goal ? (
							<span className="max-w-full truncate rounded-full bg-primary/10 px-2 py-0.5 text-primary/80">
								{goal.title}
							</span>
						) : null}
						{task.total_subtasks > 0 ? (
							<span className="rounded-full bg-muted px-2 py-0.5">
								{task.completed_subtasks}/{task.total_subtasks} subtasks
							</span>
						) : null}
					</div>
				</div>
				{showStatus ? (
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
			</div>
			{task.description && !compact ? (
				<p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
					{task.description}
				</p>
			) : null}
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
					{compact ? null : <span>Delete</span>}
				</button>
			</div>
		</article>
	);
}
