import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { applyTheme, getStoredTheme } from "./lib/theme";
import { getRouter } from "./router";

applyTheme(getStoredTheme());

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: 1, staleTime: 15_000 },
	},
});
const router = getRouter();

const rootElement = document.getElementById("app");

if (!rootElement) {
	throw new Error("Root element #app was not found");
}

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
}
