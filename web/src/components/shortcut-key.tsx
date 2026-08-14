interface ShortcutKeyProps {
	children: string;
	className?: string;
}

export function ShortcutKey({ children, className = "" }: ShortcutKeyProps) {
	return (
		<kbd
			className={`inline-flex min-w-5 items-center justify-center rounded-md border border-border/80 bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-4 text-muted-foreground shadow-sm ${className}`}
		>
			{children}
		</kbd>
	);
}
