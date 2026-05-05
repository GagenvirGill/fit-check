const rawBackendUrl = import.meta.env.VITE_BACKEND_URL;

if (!rawBackendUrl) {
	throw new Error("Missing required VITE_BACKEND_URL");
}

export const backendUrl = rawBackendUrl.replace(/\/+$/, "");

export const buildBackendUrl = (path: string): string => {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${backendUrl}${normalizedPath}`;
};
