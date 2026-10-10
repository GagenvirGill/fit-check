import type { MouseEventHandler, ReactNode } from "react";
import styles from "./ContextMenuButton.module.css";

type ContextMenuButtonProps = {
	text: string;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	moreContent?: ReactNode;
	disabled?: boolean;
};

const ContextMenuButton = ({ text, onClick, moreContent, disabled = false }: ContextMenuButtonProps) => {
	return (
		<button
			className={styles.contextMenuButton}
			onClick={onClick}
			disabled={disabled}
		>
			{text}
			{moreContent}
		</button>
	);
};

export default ContextMenuButton;
