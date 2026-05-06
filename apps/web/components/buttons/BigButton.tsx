import type { MouseEventHandler } from "react";
import styles from "./BigButton.module.css";

type BigButtonProps = {
	type?: "button" | "submit" | "reset";
	text: string;
	onClick?: MouseEventHandler<HTMLButtonElement>;
};

const BigButton = ({ type = "button", text, onClick }: BigButtonProps) => {
	return (
		<button className={styles.customButton} type={type} onClick={onClick}>
			{text}
		</button>
	);
};

export default BigButton;
