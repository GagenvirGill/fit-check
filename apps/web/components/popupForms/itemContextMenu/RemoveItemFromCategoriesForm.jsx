
import React from "react";
import styles from "../ContextMenuPopUpStyles.module.css";
import { useSetAtom } from "jotai";
import { addNotificationAtom } from "@/jotai/notifications-atom";
import { removeItemFromCategoriesAtom } from "@/jotai/items-atom";

import CategoriesCheckboxForm from "@/components/forms/CategoriesCheckboxForm";

const RemoveItemFromCategoriesForm = ({
	itemId,
	handleClose,
	itemsCurrCategories,
}) => {
	const addNotification = useSetAtom(addNotificationAtom);
	const removeItemFromCategories = useSetAtom(removeItemFromCategoriesAtom);
	const handleSubmit = async (selectedCategories) => {
		try {
			await removeItemFromCategories({
				itemId,
				categoryIds: selectedCategories,
			});
			handleClose();
			addNotification(
				"Successfully Removed Those Categories from Your Item"
			);
		} catch {
			addNotification(
				"An Error Occured while trying to Remove Item from Categories!"
			);
		}
	};

	return (
		<>
			<p className={styles.formTitle}>
				Select Which Categories to Remove this Item from
			</p>
			<CategoriesCheckboxForm
				formId="RemoveItemFromCategoriesForm"
				handleSubmit={handleSubmit}
				displayCategories={itemsCurrCategories}
			/>
		</>
	);
};

export default RemoveItemFromCategoriesForm;
