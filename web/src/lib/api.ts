export interface ApiErrorBody {
	code?: string;
	message?: string;
	detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>;
}

export class ApiError extends Error {
	readonly status: number;
	readonly code?: string;

	constructor(status: number, body: ApiErrorBody) {
		const detail = Array.isArray(body.detail)
			? body.detail
					.map((item) => item.msg)
					.filter(Boolean)
					.join(", ")
			: body.detail;
		super(body.message ?? detail ?? `Request failed with status ${status}`);
		this.name = "ApiError";
		this.status = status;
		this.code = body.code;
	}
}

export async function apiRequest<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	const headers = new Headers(init?.headers);
	if (init?.body) {
		headers.set("Content-Type", "application/json");
	}
	const response = await fetch(path, { ...init, headers });
	if (!response.ok) {
		let body: ApiErrorBody = {};
		try {
			body = (await response.json()) as ApiErrorBody;
		} catch {
			body = {};
		}
		throw new ApiError(response.status, body);
	}
	if (response.status === 204) {
		return undefined as T;
	}
	return (await response.json()) as T;
}

export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Something went wrong";
}
