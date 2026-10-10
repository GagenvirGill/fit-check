import { useAuth } from "@/providers/auth/useAuth";
import styles from "./GenericPageStyles.module.css";
import Button from "../components/buttons/Button";

const Welcome = () => {
	const { user, isAuthenticated, login } = useAuth();

	const handleLogin = (e) => {
		e.preventDefault();
		login();
	};

	return (
		<div className={styles.pageContainer}>
			<div className={styles.pageTitle}>Welcome to Your Fashion Fits</div>
			<div className={styles.pageText}>
				{isAuthenticated ? `Hello ${user?.email ?? ""}` : "Please Log In"}
			</div>
			{isAuthenticated ? (
				<Button onClick={handleLogin} text="Switch Accounts" />
			) : (
				<Button onClick={handleLogin} text="Login with Google" />
			)}
		</div>
	);
};

export default Welcome;
