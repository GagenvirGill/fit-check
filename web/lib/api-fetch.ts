import { buildBackendUrl } from "@/lib/backend-url";

const parseErrorMessage = async (response: Response): Promise<string> => {
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

export const apiFetchJson = async <TResponse>(
	path: string,
	options: Omit<RequestInit, "credentials"> = {}
): Promise<TResponse> => {
	const response = await fetch(buildBackendUrl(path), {
		...options,
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(await parseErrorMessage(response));
	}

	return response.json() as Promise<TResponse>;
};

export const apiFetchVoid = async (
	path: string,
	options: Omit<RequestInit, "credentials"> = {}
): Promise<void> => {
	const response = await fetch(buildBackendUrl(path), {
		...options,
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(await parseErrorMessage(response));
	}
};
