const rawR2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

if (!rawR2PublicUrl) {
	throw new Error("Missing required VITE_R2_PUBLIC_URL");
}

const r2PublicUrl = rawR2PublicUrl.replace(/\/+$/, "");

export const buildImageUrl = (imagePath: string): string => {
	const trimmed = imagePath.trim();
	if (!trimmed) {
		return trimmed;
	}

	if (trimmed.startsWith("/") && !trimmed.startsWith("/items/")) {
		return trimmed;
	}

	const key = trimmed.replace(/^\/+/, "");
	return `${r2PublicUrl}/${key}`;
};
