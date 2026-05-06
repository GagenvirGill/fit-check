import type { ChangeEventHandler } from "react";
import styles from "./RadioButton.module.css";

type RadioButtonProps = {
	text: string;
	buttonId: string;
	value: string;
	checked?: boolean;
	onChange?: ChangeEventHandler<HTMLInputElement>;
};

const RadioButton = ({
	text,
	buttonId,
	value,
	checked = false,
	onChange,
}: RadioButtonProps) => {
	return (
		<>
			<label className={styles.radioButton} htmlFor={buttonId}>
				<input
					type="radio"
					id={buttonId}
					name={buttonId}
					value={value}
					checked={checked}
					onChange={onChange}
				/>
				{text}
			</label>
		</>
	);
};

export default RadioButton;
