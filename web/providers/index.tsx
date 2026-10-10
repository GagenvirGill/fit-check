
import type { ReactNode } from "react";
import AuthProvider from "@/providers/auth/AuthProvider";
import DataLoader from "./data-loader";

interface ProvidersProps {
	children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
	return (
		<AuthProvider>
			<DataLoader>
				{children}
			</DataLoader>
		</AuthProvider>
	);
}
