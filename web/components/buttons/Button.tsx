import type { MouseEventHandler } from "react";
import styles from "./Button.module.css";

type ButtonProps = {
	type?: "button" | "submit" | "reset";
	text: string;
	disable?: boolean;
	onClick?: MouseEventHandler<HTMLButtonElement>;
};

const Button = ({ type = "button", text, disable = false, onClick }: ButtonProps) => {
	return (
		<button
			className={styles.customButton}
			disabled={disable}
			type={type}
			onClick={onClick}
		>
			{text}
		</button>
	);
};

export default Button;
