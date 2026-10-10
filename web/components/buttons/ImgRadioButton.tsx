import type { ChangeEventHandler } from "react";
import styles from "./ImgRadioButton.module.css";

type ImgRadioButtonProps = {
	buttonId: string;
	imgPath: string;
	isSelected: boolean;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	formId: string;
};

const ImgRadioButton = ({
	buttonId,
	imgPath,
	isSelected,
	onChange,
	formId,
}: ImgRadioButtonProps) => {
	return (
		<label className={styles.imgRadioButton}>
			<input
				type="radio"
				id={buttonId}
				checked={isSelected}
				onChange={onChange}
				name={formId}
			/>
			<img src={imgPath} alt="Preview" id={`${buttonId}-${formId}-img`} />
		</label>
	);
};

export default ImgRadioButton;
