import type { AuthMeResponse } from "@fit-check/shared/types/contracts/auth";
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

export const getGoogleAuthUrl = () => buildBackendUrl("/auth/google");

export async function getCurrentUser(): Promise<AuthMeResponse | null> {
	try {
		const response = await fetch(buildBackendUrl("/auth/me"), {
			credentials: "include",
		});

		if (!response.ok) {
			return null;
		}

		return response.json() as Promise<AuthMeResponse>;
	} catch {
		return null;
	}
}

export async function logoutCurrentUser(): Promise<void> {
	const response = await fetch(buildBackendUrl("/auth/logout"), {
		method: "POST",
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(await parseErrorMessage(response));
	}
}
