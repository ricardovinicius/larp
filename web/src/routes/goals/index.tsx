import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Plus, Target } from "lucide-react";
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

	return (
		<section>
			<header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<p className="mb-2 font-medium text-primary">Your direction</p>
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
			) : goalsQuery.data.length === 0 ? (
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
				<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
					{goalsQuery.data.map((goal) => (
						<Link
							className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
							key={goal.id}
							params={{ goalId: goal.id }}
							to="/goals/$goalId"
						>
							<div className="mb-8 flex items-start justify-between gap-3">
								<h2 className="text-xl font-bold group-hover:text-primary">
									{goal.title}
								</h2>
								<Target
									aria-hidden="true"
									className="size-5 shrink-0 text-primary"
								/>
							</div>
							{goal.due_date ? (
								<p
									className={`mb-4 flex items-center gap-2 text-sm ${isOverdue(goal.due_date) ? "font-medium text-destructive" : "text-muted-foreground"}`}
								>
									<Calendar aria-hidden="true" className="size-4" />
									{isOverdue(goal.due_date) ? "Overdue · " : ""}
									{formatDueDate(goal.due_date)}
								</p>
							) : null}
							<GoalProgress progress={goal.progress} />
						</Link>
					))}
				</div>
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
