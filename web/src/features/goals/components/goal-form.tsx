import { useState } from "react";
import { errorMessage } from "#/lib/api";
import type { Goal, GoalInput } from "../api";

interface GoalFormProps {
	goal?: Goal;
	onSubmit: (input: GoalInput) => Promise<void>;
	onCancel: () => void;
}

export function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string>();

	return (
		<form
			className="space-y-5"
			onSubmit={async (event) => {
				event.preventDefault();
				setPending(true);
				setError(undefined);
				const data = new FormData(event.currentTarget);
				try {
					await onSubmit({
						title: String(data.get("title") ?? ""),
						description: String(data.get("description") ?? ""),
						due_date: String(data.get("due_date") ?? "") || null,
					});
				} catch (submissionError) {
					setError(errorMessage(submissionError));
				} finally {
					setPending(false);
				}
			}}
		>
			<label className="grid gap-2 font-medium">
				Title
				<input
					className="rounded-xl border bg-background px-3 py-2 font-normal"
					defaultValue={goal?.title}
					maxLength={200}
					name="title"
					required
				/>
			</label>
			<label className="grid gap-2 font-medium">
				Description
				<textarea
					className="min-h-28 resize-y rounded-xl border bg-background px-3 py-2 font-normal"
					defaultValue={goal?.description}
					maxLength={10000}
					name="description"
				/>
			</label>
			<label className="grid gap-2 font-medium">
				Due date
				<input
					className="rounded-xl border bg-background px-3 py-2 font-normal"
					defaultValue={goal?.due_date ?? ""}
					name="due_date"
					type="date"
				/>
			</label>
			{error ? (
				<p
					className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
					role="alert"
				>
					{error}
				</p>
			) : null}
			<div className="flex justify-end gap-3">
				<button className="button-secondary" onClick={onCancel} type="button">
					Cancel
				</button>
				<button className="button-primary" disabled={pending} type="submit">
					{pending ? "Saving…" : goal ? "Save changes" : "Create goal"}
				</button>
			</div>
		</form>
	);
}
