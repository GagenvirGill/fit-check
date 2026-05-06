import type { ChangeEventHandler, MouseEventHandler } from "react";
import styles from "./ImgButton.module.css";

type ImgButtonProps = {
	buttonId: string;
	imgFileName: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	className?: string;
	onClick?: MouseEventHandler<HTMLInputElement>;
};

const ImgButton = ({
	buttonId,
	imgFileName,
	onChange,
	className,
	onClick,
}: ImgButtonProps) => {
	let chosenImgStyles;

	if (className) {
		chosenImgStyles = `${className} ${styles.imgIcon}`;
	} else {
		chosenImgStyles = styles.imgIcon;
	}

	return (
		<label className={styles.imgBtn} htmlFor={buttonId}>
			<input
				type="checkbox"
				id={buttonId}
				onChange={onChange}
				onClick={onClick}
			/>
			<img
				src={imgFileName}
				alt={buttonId}
				className={chosenImgStyles}
			></img>
		</label>
	);
};

export default ImgButton;
