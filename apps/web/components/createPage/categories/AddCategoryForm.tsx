
import { useState } from "react";
import { useSetAtom } from "jotai";
import { addNotificationAtom } from "@/jotai/notifications-atom";
import { createCategoryAtom } from "@/jotai/categories-atom";

import styles from "./AddCategoryForm.module.css";
import Button from "@/components/buttons/Button";

const AddCategoryForm = () => {
	const addNotification = useSetAtom(addNotificationAtom);
	const createCategory = useSetAtom(createCategoryAtom);
	const [name, setName] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();

		const nameToCreate = name;
		setName("");

		try {
			await createCategory(nameToCreate);
			addNotification(
				`Successfully Created the '${nameToCreate}' Category!`
			);
		} catch {
			addNotification(`An Error Occured Trying to Create a Category!`);
		}
	};

	return (
		<div className={styles.formContainer}>
			<p className={styles.formTitle}>Create a new Category</p>
				<form
					onSubmit={(event) => {
						void handleSubmit(event);
					}}
				>
				<label htmlFor="name" className={styles.formText}>
					Category Name:{" "}
				</label>
				<input
					type="text"
					id="name"
					className={styles.textInput}
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<br />
				<br />
				<Button type="submit" text={"Create"} />
				<br />
				<br />
			</form>
		</div>
	);
};

export default AddCategoryForm;
