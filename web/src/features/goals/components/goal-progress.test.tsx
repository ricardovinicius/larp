import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoalProgress } from "./goal-progress";

describe("GoalProgress", () => {
	it("shows the percentage and contributing task fraction", () => {
		render(
			<GoalProgress
				progress={{ completed_tasks: 2, percentage: 66, total_tasks: 3 }}
			/>,
		);

		expect(screen.getByText("66%", { exact: false })).toBeInTheDocument();
		expect(screen.getByText(/2\/3 tasks/)).toBeInTheDocument();
		expect(screen.getByRole("progressbar")).toHaveAttribute(
			"aria-valuenow",
			"66",
		);
	});
});
