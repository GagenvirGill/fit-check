import type { AuthMeResponse } from "@fit-check/shared/types/contracts/auth";
import { get, post, backendUrl } from "@/api/client";

export const getGoogleAuthUrl = () => `${backendUrl}/auth/google`;

export async function getCurrentUser(): Promise<AuthMeResponse | null> {
	try {
		return await get<AuthMeResponse>("/auth/me");
	} catch {
		return null;
	}
}

export async function logoutCurrentUser(): Promise<void> {
	await post<void>("/auth/logout");
}
