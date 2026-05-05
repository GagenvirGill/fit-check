
import React, { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { categoriesSortedByNameAscAtom } from "@/jotai/categories-atom";
import { addNotificationAtom } from "@/jotai/notifications-atom";
import styles from "../ContextMenuPopUpStyles.module.css";
import { addItemToCategoriesAtom } from "@/jotai/items-atom";

import CategoriesCheckboxForm from "@/components/forms/CategoriesCheckboxForm";

const AddItemToCategoriesForm = ({
	itemId,
	handleClose,
	itemsCurrCategories,
}) => {
	const addNotification = useSetAtom(addNotificationAtom);
	const addItemToCategories = useSetAtom(addItemToCategoriesAtom);
	const categories = useAtomValue(categoriesSortedByNameAscAtom);
	const [filteredCategories, setFilteredCategories] = useState([]);

	useEffect(() => {
		const currCategories = new Set();
		itemsCurrCategories.map((category) => {
			currCategories.add(category.categoryId);
		});

		const filtCategories = categories.filter((category) => {
			return !currCategories.has(category.categoryId);
		});

		setFilteredCategories(filtCategories);
	}, [categories, itemsCurrCategories]);

	const handleSubmit = async (selectedCategories) => {
		try {
			await addItemToCategories({
				itemId,
				categoryIds: selectedCategories,
			});
			handleClose();
			addNotification(
				"Successfully Added Those Categories to Your Item"
			);
		} catch {
			addNotification(
				"An Error Occured while trying to Add Item to Categories!"
			);
		}
	};

	return (
		<>
			<p className={styles.formTitle}>
				Select Which Categories to Add this Item to
			</p>
			<CategoriesCheckboxForm
				formId="AddItemToCategoriesForm"
				handleSubmit={handleSubmit}
				displayCategories={filteredCategories}
			/>
		</>
	);
};

export default AddItemToCategoriesForm;
