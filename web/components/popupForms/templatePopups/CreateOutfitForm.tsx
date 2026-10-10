
import { useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import styles from "../ContextMenuPopUpStyles.module.css";
import { useAtomValue, useSetAtom } from "jotai";
import { templateRowsAtom, setWholeTemplateAtom } from "@/jotai/outfit-template-atom";
import { addNotificationAtom } from "@/jotai/notifications-atom";

import { createOutfitAtom } from "@/jotai/outfits-atom";

import Button from "@/components/buttons/Button";

type CreateOutfitFormProps = {
	setShowCreateOutfitForm: (show: boolean) => void;
};

const CreateOutfitForm = ({ setShowCreateOutfitForm }: CreateOutfitFormProps) => {
	const templateRows = useAtomValue(templateRowsAtom);
	const setWholeTemplate = useSetAtom(setWholeTemplateAtom);
	const addNotification = useSetAtom(addNotificationAtom);
	const createOutfit = useSetAtom(createOutfitAtom);

	const [description, setDescription] = useState("");
	const [date, setDate] = useState("");

	const handleCloseForm = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();

		setShowCreateOutfitForm(false);
	};

	const handleCreateOutfit = async (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();

			const outfitsItems: Array<Array<{ itemId: string; itemWeight: number }>> = [];

			for (const row of templateRows) {
				const rowItems: Array<{ itemId: string; itemWeight: number }> = [];

			for (const box of row) {
				if (!box.itemId) {
					addNotification(
						"Please select items for all boxes or remove them."
					);
					return;
				}
				rowItems.push({
					itemId: box.itemId,
					itemWeight: box.scale * 10,
				});
			}

			if (rowItems.length > 5) {
				addNotification(
					"You can only select up to 5 items per row."
				);
				return;
			}

			outfitsItems.push(rowItems);
		}

		if (outfitsItems.length === 0) {
			addNotification(
				"Please select at least one item to create an outfit."
			);
			return;
		}
		if (outfitsItems.length > 8) {
			addNotification("You can only have up to 8 rows of items.");
			return;
		}
		if (outfitsItems.length !== templateRows.length) {
			addNotification(
				"Please select items for the empty boxes or remove them."
			);
			return;
		}
		if (date === "") {
			addNotification("Please select a date.");
			return;
		}

		try {
			setShowCreateOutfitForm(false);
			await createOutfit({
				dateWorn: date,
				description,
				items: outfitsItems,
			});
			setWholeTemplate({ newTemplate: [] });
			addNotification(`Successfully Created an Outfit for ${date}!`);
		} catch {
			addNotification(
				`An Error Occurred while Creating an Outfit for ${date}!`
			);
		}
	};

	return (
		<>
			<div className={styles.overlay}></div>
			<div className={styles.popupForm}>
				<p className={styles.formTitle}>
					Select a Date and Description for the Outfit
				</p>
				<input
						type="date"
						placeholder="YYYY-MM-DD"
						value={date}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
						className={styles.inputFieldDate}
					/>
				<br />
				<input
						type="text"
						placeholder="Outfit Description"
						value={description}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
						className={styles.inputFieldText}
					/>
				<br />
					<Button
						type="submit"
						text="Create Outfit"
						onClick={(event) => {
							void handleCreateOutfit(event);
						}}
					/>
				<Button type="submit" text="Cancel" onClick={handleCloseForm} />
				<br />
				<br />
			</div>
		</>
	);
};

export default CreateOutfitForm;
