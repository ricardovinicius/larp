import type { ReactNode } from "react";
import { useEffect } from "react";

interface ModalProps {
	title: string;
	children: ReactNode;
	onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
	useEffect(() => {
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
			<button
				aria-label="Close dialog backdrop"
				className="absolute inset-0 cursor-default"
				onClick={onClose}
				type="button"
			/>
			<section
				aria-labelledby="modal-title"
				aria-modal="true"
				className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl"
				role="dialog"
			>
				<div className="mb-5 flex items-center justify-between gap-4">
					<h2 className="text-xl font-semibold" id="modal-title">
						{title}
					</h2>
					<button
						aria-label="Close dialog"
						className="rounded-lg px-3 py-1 text-xl text-muted-foreground hover:bg-muted"
						onClick={onClose}
						type="button"
					>
						×
					</button>
				</div>
				{children}
			</section>
		</div>
	);
}
