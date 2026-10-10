import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import type { GetCurrentUserResponse } from "@packages/contracts/auth";
import {
	getCurrentUser,
	getGoogleAuthUrl,
	logoutCurrentUser,
} from "@/providers/auth/auth-client";

export type AuthContextValue = {
	user: GetCurrentUserResponse | null;
	isAuthenticated: boolean;
	loading: boolean;
	login: () => void;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
	children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<GetCurrentUserResponse | null>(null);
	const [loading, setLoading] = useState(true);

	const refreshUser = useCallback(async () => {
		setLoading(true);
		try {
			const nextUser = await getCurrentUser();
			setUser(nextUser);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refreshUser();
	}, [refreshUser]);

	const login = useCallback(() => {
		window.location.assign(getGoogleAuthUrl());
	}, []);

	const logout = useCallback(async () => {
		try {
			await logoutCurrentUser();
		} finally {
			setUser(null);
		}
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			isAuthenticated: Boolean(user),
			loading,
			login,
			logout,
			refreshUser,
		}),
		[user, loading, login, logout, refreshUser]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
