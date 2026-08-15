import type { Goal } from "#/features/goals/api";
import type { Task, TaskStatus } from "../api";
import { TaskItem } from "./task-item";

interface TaskListProps {
	tasks: Array<Task>;
	goals: Array<Goal>;
	onEdit: (task: Task) => void;
	onAddSubtask: (task: Task) => void;
	onStatus: (
		task: Task,
		status: TaskStatus,
		position?: number,
	) => Promise<void>;
	onDelete: (task: Task) => void;
}

export function TaskList(props: TaskListProps) {
	const visibleIds = new Set(props.tasks.map((task) => task.id));
	const topLevel = props.tasks.filter(
		(task) => task.parent_id === null || !visibleIds.has(task.parent_id),
	);
	return (
		<ul className="divide-y overflow-hidden rounded-2xl border bg-card/70 shadow-sm">
			{topLevel.map((task) => {
				const subtasks = props.tasks.filter(
					(candidate) => candidate.parent_id === task.id,
				);
				return (
					<li key={task.id}>
						<TaskItem task={task} {...props} />
						{subtasks.length > 0 ? (
							<ul className="border-t bg-muted/[0.16] pl-6 sm:pl-12">
								{subtasks.map((subtask) => (
									<li
										className="border-l border-primary/20 [&:not(:last-child)]:border-b"
										key={subtask.id}
									>
										<TaskItem nested task={subtask} {...props} />
									</li>
								))}
							</ul>
						) : null}
					</li>
				);
			})}
		</ul>
	);
}
