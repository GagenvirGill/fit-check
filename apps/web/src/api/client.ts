export type QueryPrimitive = string | number | boolean;
export type QueryParams = Record<string, QueryPrimitive | QueryPrimitive[] | null | undefined>;

const rawBackendUrl = import.meta.env.VITE_BACKEND_URL;

if (!rawBackendUrl) {
	throw new Error("Missing required VITE_BACKEND_URL");
}

export const backendUrl = rawBackendUrl.replace(/\/+$/, "");

const buildUrl = (path: string, params?: QueryParams): string => {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const url = new URL(`${backendUrl}${normalizedPath}`);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value === undefined || value === null) {
				continue;
			}
			if (Array.isArray(value)) {
				for (const curr of value) {
					url.searchParams.append(key, String(curr));
				}
				continue;
			}

			url.searchParams.append(key, String(value));
		}
	}

	return url.toString();
};

const getErrorMessage = async (response: Response): Promise<string> => {
	try {
		const payload = await response.json();
		if (payload && typeof payload.message === "string") {
			return payload.message;
		}
	} catch {
		// no-op: best effort parsing only
	}

	return `Request failed with status ${response.status}`;
};

const request = async <TResponse>(
	method: "GET" | "POST" | "PATCH" | "DELETE",
	path: string,
	options: {
		body?: FormData | object;
		params?: QueryParams;
	} = {}
): Promise<TResponse> => {
	const headers: Record<string, string> = {};
	let body: BodyInit | undefined;

	if (options.body instanceof FormData) {
		body = options.body;
	} else if (options.body !== undefined) {
		headers["Content-Type"] = "application/json";
		body = JSON.stringify(options.body);
	}

	const response = await fetch(buildUrl(path, options.params), {
		method,
		headers,
		body,
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response));
	}

	if (response.status === 204) {
		return undefined as TResponse;
	}

	return response.json() as Promise<TResponse>;
};

export const get = <TResponse>(path: string, params?: QueryParams) =>
	request<TResponse>("GET", path, { params });

export const post = <TResponse>(path: string, body?: FormData | object) =>
	request<TResponse>("POST", path, { body });

export const patch = <TResponse>(path: string, body?: FormData | object) =>
	request<TResponse>("PATCH", path, { body });

export const del = <TResponse>(path: string, body?: FormData | object) =>
	request<TResponse>("DELETE", path, { body });
