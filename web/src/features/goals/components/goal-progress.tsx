import type { GoalProgress as GoalProgressData } from "../api";

export function GoalProgress({ progress }: { progress: GoalProgressData }) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium">Progress</span>
				<span className="text-muted-foreground">
					{progress.percentage}% · {progress.completed_tasks}/
					{progress.total_tasks} tasks
				</span>
			</div>
			<div
				aria-label={`${progress.percentage}% complete`}
				aria-valuemax={100}
				aria-valuemin={0}
				aria-valuenow={progress.percentage}
				className="h-2 overflow-hidden rounded-full bg-muted"
				role="progressbar"
			>
				<div
					className="h-full rounded-full bg-primary transition-[width]"
					style={{ width: `${progress.percentage}%` }}
				/>
			</div>
		</div>
	);
}
