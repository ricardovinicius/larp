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
		<div className="space-y-4">
			{topLevel.map((task) => {
				const subtasks = props.tasks.filter(
					(candidate) => candidate.parent_id === task.id,
				);
				return (
					<div className="space-y-2" key={task.id}>
						<TaskItem task={task} {...props} />
						{subtasks.length > 0 ? (
							<div className="ml-5 space-y-2 border-l-2 border-primary/20 pl-4 sm:ml-10">
								{subtasks.map((subtask) => (
									<TaskItem
										compact
										key={subtask.id}
										task={subtask}
										{...props}
									/>
								))}
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
