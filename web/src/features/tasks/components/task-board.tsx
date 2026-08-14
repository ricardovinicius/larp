import { type PointerEvent, useRef, useState } from "react";
import type { Goal } from "#/features/goals/api";
import type { Task, TaskStatus } from "../api";
import { taskStatusLabels } from "../api";
import { TaskItem } from "./task-item";

const boardStatuses = [
	"BACKLOG",
	"TODO",
	"DOING",
	"DONE",
] as const satisfies ReadonlyArray<TaskStatus>;
type BoardStatus = (typeof boardStatuses)[number];

const statusDot: Record<BoardStatus, string> = {
	BACKLOG: "bg-slate-400",
	TODO: "bg-sky-400",
	DOING: "bg-amber-400",
	DONE: "bg-emerald-400",
};

interface TaskBoardProps {
	tasks: Array<Task>;
	goals: Array<Goal>;
	includeClosed: boolean;
	onEdit: (task: Task) => void;
	onAddSubtask: (task: Task) => void;
	onStatus: (
		task: Task,
		status: TaskStatus,
		position?: number,
	) => Promise<void>;
	onDelete: (task: Task) => void;
}

interface ActivePointerDrag {
	pointerId: number;
	startX: number;
	startY: number;
	started: boolean;
	source: HTMLLIElement;
	task: Task;
}

function isBoardStatus(value: string | undefined): value is BoardStatus {
	return boardStatuses.some((status) => status === value);
}

function boardStatusAtPoint(
	clientX: number,
	clientY: number,
): BoardStatus | undefined {
	const value = document
		.elementFromPoint(clientX, clientY)
		?.closest<HTMLElement>("[data-task-status]")?.dataset.taskStatus;
	return isBoardStatus(value) ? value : undefined;
}

function createPointerDragPreview(
	source: HTMLLIElement,
	clientX: number,
	clientY: number,
): HTMLElement {
	const bounds = source.getBoundingClientRect();
	const preview = source.cloneNode(true) as HTMLElement;
	preview.setAttribute("aria-hidden", "true");
	preview.setAttribute("inert", "");
	Object.assign(preview.style, {
		boxShadow: "0 20px 50px rgba(0, 0, 0, 0.42)",
		left: `${clientX}px`,
		listStyle: "none",
		opacity: "0.96",
		pointerEvents: "none",
		position: "fixed",
		top: `${clientY}px`,
		transform: "rotate(1deg) scale(1.02)",
		transformOrigin: "top left",
		width: `${bounds.width}px`,
		zIndex: "2147483647",
	});
	document.body.append(preview);
	return preview;
}

export function TaskBoard(props: TaskBoardProps) {
	const activeDragRef = useRef<ActivePointerDrag | null>(null);
	const dragPreviewRef = useRef<HTMLElement | null>(null);
	const previousBodyStyleRef = useRef({ cursor: "", userSelect: "" });
	const [draggedTaskId, setDraggedTaskId] = useState<string>();
	const [dragOverStatus, setDragOverStatus] = useState<BoardStatus>();
	const topLevel = props.tasks.filter((task) => task.parent_id === null);

	const clearDragState = () => {
		dragPreviewRef.current?.remove();
		dragPreviewRef.current = null;
		activeDragRef.current = null;
		document.body.style.cursor = previousBodyStyleRef.current.cursor;
		document.body.style.userSelect = previousBodyStyleRef.current.userSelect;
		setDraggedTaskId(undefined);
		setDragOverStatus(undefined);
	};

	const moveDragPreview = (clientX: number, clientY: number) => {
		if (!dragPreviewRef.current) return;
		dragPreviewRef.current.style.left = `${clientX}px`;
		dragPreviewRef.current.style.top = `${clientY}px`;
	};

	const startPointerDrag = (
		drag: ActivePointerDrag,
		clientX: number,
		clientY: number,
	) => {
		drag.started = true;
		previousBodyStyleRef.current = {
			cursor: document.body.style.cursor,
			userSelect: document.body.style.userSelect,
		};
		document.body.style.cursor = "grabbing";
		document.body.style.userSelect = "none";
		dragPreviewRef.current = createPointerDragPreview(
			drag.source,
			clientX,
			clientY,
		);
		setDraggedTaskId(drag.task.id);
	};

	const finishPointerDrag = (
		event: PointerEvent<HTMLLIElement>,
		task: Task,
	) => {
		const drag = activeDragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		const targetStatus = drag.started
			? boardStatusAtPoint(event.clientX, event.clientY)
			: undefined;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		clearDragState();
		if (targetStatus) {
			const targetPosition = topLevel.filter(
				(candidate) => candidate.status === targetStatus,
			).length;
			void props
				.onStatus(task, targetStatus, targetPosition)
				.catch(() => undefined);
		}
	};

	return (
		<>
			<div className="grid items-stretch gap-3 xl:grid-cols-4">
				{boardStatuses.map((status) => {
					const columnTasks = topLevel.filter((task) => task.status === status);
					return (
						<section
							className="flex min-h-[28rem] flex-col rounded-2xl border bg-card/45 p-3 shadow-sm lg:min-h-[calc(100vh-23rem)]"
							data-task-status={status}
							key={status}
						>
							<header className="mb-3 flex items-center justify-between px-1 py-1">
								<h2 className="flex items-center gap-2 text-sm font-semibold">
									<span
										className={`size-2 rounded-full ${statusDot[status]}`}
									/>
									{taskStatusLabels[status]}
								</h2>
								<span className="min-w-6 rounded-full bg-background/80 px-2 py-0.5 text-center text-xs font-medium text-muted-foreground">
									{columnTasks.length}
								</span>
							</header>
							<ul
								className={`min-h-32 flex-1 space-y-3 rounded-xl transition-colors ${dragOverStatus === status ? "bg-primary/[0.04] ring-1 ring-inset ring-primary/30" : ""}`}
							>
								{columnTasks.length === 0 ? (
									<li
										className={`grid h-32 place-items-center rounded-xl border border-dashed text-xs transition ${dragOverStatus === status ? "border-primary/40 text-primary" : "text-muted-foreground/60"}`}
									>
										{dragOverStatus === status
											? "Release to move"
											: "Drop tasks here"}
									</li>
								) : null}
								{columnTasks.map((task, index) => (
									<li
										aria-grabbed={draggedTaskId === task.id}
										className={`cursor-grab touch-none transition duration-150 ${draggedTaskId === task.id ? "scale-[0.98] opacity-35" : "scale-100 opacity-100"}`}
										key={task.id}
										onPointerCancel={clearDragState}
										onPointerDown={(event) => {
											if (
												!event.isPrimary ||
												event.button !== 0 ||
												(event.target instanceof Element &&
													event.target.closest(
														"button, select, a, input, textarea",
													))
											) {
												return;
											}
											event.currentTarget.setPointerCapture(event.pointerId);
											activeDragRef.current = {
												pointerId: event.pointerId,
												startX: event.clientX,
												startY: event.clientY,
												started: false,
												source: event.currentTarget,
												task,
											};
										}}
										onPointerMove={(event) => {
											const drag = activeDragRef.current;
											if (!drag || drag.pointerId !== event.pointerId) return;
											if (!drag.started) {
												const distance = Math.hypot(
													event.clientX - drag.startX,
													event.clientY - drag.startY,
												);
												if (distance < 6) return;
												startPointerDrag(drag, event.clientX, event.clientY);
											}
											event.preventDefault();
											moveDragPreview(event.clientX, event.clientY);
											setDragOverStatus(
												boardStatusAtPoint(event.clientX, event.clientY),
											);
										}}
										onPointerUp={(event) => finishPointerDrag(event, task)}
									>
										<TaskItem
											compact
											{...props}
											onMoveDown={
												index < columnTasks.length - 1
													? () =>
															void props
																.onStatus(task, status, index + 1)
																.catch(() => undefined)
													: undefined
											}
											onMoveUp={
												index > 0
													? () =>
															void props
																.onStatus(task, status, index - 1)
																.catch(() => undefined)
													: undefined
											}
											showStatus={false}
											task={task}
										/>
									</li>
								))}
							</ul>
						</section>
					);
				})}
			</div>
			{props.includeClosed ? (
				<section className="mt-8 border-t pt-6">
					<h2 className="mb-3 text-lg font-semibold">Closed</h2>
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{topLevel
							.filter((task) => task.status === "CLOSED")
							.map((task) => (
								<TaskItem
									compact
									key={task.id}
									showStatus={false}
									task={task}
									{...props}
								/>
							))}
					</div>
				</section>
			) : null}
		</>
	);
}
