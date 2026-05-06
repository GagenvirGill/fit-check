import type { ChangeEventHandler } from "react";
import styles from "./ImgCheckboxButton.module.css";

type ImgCheckboxButtonProps = {
	imgPath: string;
	buttonId: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
};

const ImgCheckboxButton = ({ imgPath, buttonId, onChange }: ImgCheckboxButtonProps) => {
	return (
		<>
			<label className={styles.imgCheckboxButton} htmlFor={buttonId}>
				<input type="checkbox" id={buttonId} onChange={onChange} />
				<img src={imgPath} alt="Preview" id={`${buttonId}-img`} />
			</label>
		</>
	);
};

export default ImgCheckboxButton;
