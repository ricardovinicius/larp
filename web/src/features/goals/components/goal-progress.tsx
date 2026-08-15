import type { GoalProgress as GoalProgressData } from "../api";

export function GoalProgress({ progress }: { progress: GoalProgressData }) {
	return (
		<div className="space-y-2.5">
			<div className="flex items-end justify-between gap-3 text-sm">
				<span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
					Progress
				</span>
				<span className="text-right text-muted-foreground">
					<strong className="font-bold text-foreground">
						{progress.percentage}%
					</strong>{" "}
					· {progress.completed_tasks}/{progress.total_tasks} tasks
				</span>
			</div>
			<div
				aria-label={`${progress.percentage}% complete`}
				aria-valuemax={100}
				aria-valuemin={0}
				aria-valuenow={progress.percentage}
				className="h-2.5 overflow-hidden rounded-full bg-muted"
				role="progressbar"
			>
				<div
					className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-[width]"
					style={{ width: `${progress.percentage}%` }}
				/>
			</div>
		</div>
	);
}
