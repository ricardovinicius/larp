import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowUpRight,
	Calendar,
	CircleGauge,
	ListChecks,
	Plus,
	Target,
} from "lucide-react";
import { useState } from "react";
import { Modal } from "#/components/modal";
import {
	createGoal,
	type GoalInput,
	goalKeys,
	goalsQueryOptions,
} from "#/features/goals/api";
import { GoalForm } from "#/features/goals/components/goal-form";
import { GoalProgress } from "#/features/goals/components/goal-progress";
import { errorMessage } from "#/lib/api";

export const Route = createFileRoute("/goals/")({ component: GoalsPage });

function formatDueDate(value: string): string {
	return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
		new Date(`${value}T00:00:00`),
	);
}

function isOverdue(value: string): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return new Date(`${value}T00:00:00`) < today;
}

function GoalsPage() {
	const [creating, setCreating] = useState(false);
	const queryClient = useQueryClient();
	const goalsQuery = useQuery(goalsQueryOptions());
	const createMutation = useMutation({
		mutationFn: createGoal,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: goalKeys.all });
			setCreating(false);
		},
	});
	const goals = goalsQuery.data ?? [];
	const completedTasks = goals.reduce(
		(total, goal) => total + goal.progress.completed_tasks,
		0,
	);
	const totalTasks = goals.reduce(
		(total, goal) => total + goal.progress.total_tasks,
		0,
	);
	const overallProgress =
		totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
	const overview = [
		{
			detail: goals.length === 1 ? "active direction" : "active directions",
			icon: Target,
			label: "Goals",
			value: goals.length,
		},
		{
			detail: `of ${totalTasks} total tasks`,
			icon: ListChecks,
			label: "Tasks completed",
			value: completedTasks,
		},
		{
			detail: "across all goals",
			icon: CircleGauge,
			label: "Overall progress",
			value: `${overallProgress}%`,
		},
	];

	return (
		<section>
			<header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
				<div>
					<p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
						Your direction
					</p>
					<h1 className="text-4xl font-black tracking-tight sm:text-5xl">
						Goals
					</h1>
					<p className="mt-3 max-w-2xl text-muted-foreground">
						Turn ambitious outcomes into visible, actionable progress.
					</p>
				</div>
				<button
					className="button-primary gap-2"
					onClick={() => setCreating(true)}
					type="button"
				>
					<Plus aria-hidden="true" className="size-4" /> New goal
				</button>
			</header>

			{goalsQuery.isPending ? (
				<p className="rounded-2xl border bg-card p-8 text-muted-foreground">
					Loading goals…
				</p>
			) : goalsQuery.isError ? (
				<div
					className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
					role="alert"
				>
					<p className="font-medium text-destructive">
						{errorMessage(goalsQuery.error)}
					</p>
					<button
						className="button-secondary mt-4"
						onClick={() => void goalsQuery.refetch()}
						type="button"
					>
						Retry
					</button>
				</div>
			) : goals.length === 0 ? (
				<div className="grid place-items-center rounded-3xl border border-dashed bg-card/60 px-6 py-20 text-center">
					<span className="mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
						<Target aria-hidden="true" className="size-8" />
					</span>
					<h2 className="text-2xl font-bold">Set your first goal</h2>
					<p className="mt-2 max-w-md text-muted-foreground">
						Choose an outcome worth working toward. You can connect tasks to it
						next.
					</p>
					<button
						className="button-primary mt-6"
						onClick={() => setCreating(true)}
						type="button"
					>
						Create a goal
					</button>
				</div>
			) : (
				<>
					<section
						aria-label="Goals overview"
						className="mb-7 grid overflow-hidden rounded-2xl border bg-card/70 shadow-sm sm:grid-cols-3 sm:divide-x"
					>
						{overview.map(({ detail, icon: Icon, label, value }) => (
							<div
								className="flex items-center gap-4 border-b p-4 last:border-b-0 sm:border-b-0 sm:p-5"
								key={label}
							>
								<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
									<Icon aria-hidden="true" className="size-5" />
								</span>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground">
										{label}
									</p>
									<p className="mt-0.5 text-xl font-black tracking-tight">
										{value}
										<span className="ml-2 text-xs font-normal tracking-normal text-muted-foreground">
											{detail}
										</span>
									</p>
								</div>
							</div>
						))}
					</section>

					<div className="mb-4 flex items-end justify-between gap-4">
						<div>
							<h2 className="text-xl font-bold">Your goals</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Choose a goal to review its work and progress.
							</p>
						</div>
						<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
							{goals.length} {goals.length === 1 ? "goal" : "goals"}
						</span>
					</div>

					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						{goals.map((goal) => {
							const overdue = goal.due_date ? isOverdue(goal.due_date) : false;
							return (
								<Link
									className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border bg-card/80 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
									key={goal.id}
									params={{ goalId: goal.id }}
									to="/goals/$goalId"
								>
									<span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent opacity-70" />
									<div className="flex items-start justify-between gap-3">
										<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
											<Target aria-hidden="true" className="size-5" />
										</span>
										<span
											className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${overdue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
										>
											<Calendar aria-hidden="true" className="size-3.5" />
											{goal.due_date
												? `${overdue ? "Overdue · " : "Due "}${formatDueDate(goal.due_date)}`
												: "No deadline"}
										</span>
									</div>
									<h3 className="mt-5 text-xl font-bold transition-colors group-hover:text-primary">
										{goal.title}
									</h3>
									<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
										{goal.description || "No description added yet."}
									</p>
									<div className="mt-auto pt-6">
										<GoalProgress progress={goal.progress} />
										<div className="mt-4 flex items-center justify-between border-t pt-3 text-sm font-medium text-muted-foreground">
											<span>Open goal</span>
											<ArrowUpRight
												aria-hidden="true"
												className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
											/>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				</>
			)}

			{creating ? (
				<Modal onClose={() => setCreating(false)} title="Create goal">
					<GoalForm
						onCancel={() => setCreating(false)}
						onSubmit={async (input: GoalInput) => {
							await createMutation.mutateAsync(input);
						}}
					/>
				</Modal>
			) : null}
		</section>
	);
}
