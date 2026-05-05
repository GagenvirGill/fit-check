import type { BootstrapResponse } from "@fit-check/shared/types/contracts/bootstrap";
import { get } from "@/api/client";
import {
	adaptBootstrapResponse,
	type BootstrapViewModel,
} from "@/lib/adapters/bootstrap";

export async function getBootstrapData(): Promise<BootstrapViewModel> {
	const response = await get<BootstrapResponse>("/bootstrap");
	return adaptBootstrapResponse(response);
}
