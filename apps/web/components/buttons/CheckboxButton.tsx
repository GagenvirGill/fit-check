import type { ChangeEventHandler } from "react";
import styles from "./CheckboxButton.module.css";

type CheckboxButtonProps = {
	text: string;
	buttonId: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	checked?: boolean;
};

const CheckboxButton = ({ text, buttonId, onChange, checked = false }: CheckboxButtonProps) => {
	return (
		<>
			<label className={styles.checkboxButton} htmlFor={buttonId}>
				<input
					type="checkbox"
					id={buttonId}
					onChange={onChange}
					checked={checked}
				/>
				{text}
			</label>
		</>
	);
};

export default CheckboxButton;
