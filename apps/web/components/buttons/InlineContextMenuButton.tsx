import type { MouseEventHandler } from "react";
import styles from "./InlineContextMenuButton.module.css";

type InlineContextMenuButtonProps = {
	texts: string[];
	onClicks: Array<MouseEventHandler<HTMLButtonElement> | undefined>;
};

const InlineContextMenuButton = ({ texts, onClicks }: InlineContextMenuButtonProps) => {
	return (
		<div className={styles.inlineButtonContainer}>
			{texts.map((text, index) => (
				<button
					key={index}
					className={styles.inlineButton}
					onClick={onClicks[index]}
				>
					{text}
				</button>
			))}
		</div>
	);
};

export default InlineContextMenuButton;
