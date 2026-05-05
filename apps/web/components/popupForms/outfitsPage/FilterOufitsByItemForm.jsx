
import React from "react";
import { useAtomValue } from "jotai";
import { filterOutfitsByItemIdsSelectorAtom } from "@/jotai/outfits-atom";
import styles from "../ContextMenuPopUpStyles.module.css";
import { useState } from "react";

import Button from "@/components/buttons/Button";
import ItemsCheckboxForm from "@/components/forms/ItemsCheckboxForm";
import CategoriesCheckboxForm from "@/components/forms/CategoriesCheckboxForm";

const FilterOutfitsByItemForm = ({ handleClose, setDisplayedOutfits }) => {
	const filterOutfitsByItems = useAtomValue(filterOutfitsByItemIdsSelectorAtom);
	const [filtCategoryIds, setFiltCategoryIds] = useState([]);

	const handleItemsSubmit = (selectedItemIds) => {
		const newDisplayOutfits = filterOutfitsByItems(selectedItemIds);
		setDisplayedOutfits(newDisplayOutfits);
		handleClose();
	};

	const handleCategoriesSubmit = (categoryIds) => {
		setFiltCategoryIds(categoryIds);
	};

	return (
		<>
			<div className={styles.overlay}></div>
			<div className={styles.popupForm}>
				<br />
				<Button onClick={handleClose} text={"Close Form"} />
				<br />
				<p className={styles.formTitle}>Filter Items by Category:</p>
				<CategoriesCheckboxForm
					handleSubmit={handleCategoriesSubmit}
					formId="filter-outfits-category-form"
				/>
				<br />
				<p className={styles.formTitle}>Filter Outfits by Items:</p>
				{filtCategoryIds.length === 0 ? (
					<p className={styles.formTitle}>
						Please Select atleast 1 Category
					</p>
				) : (
					<ItemsCheckboxForm
						handleSubmit={handleItemsSubmit}
						filteringCategoryIds={filtCategoryIds}
					/>
				)}
				<br />
			</div>
		</>
	);
};

export default FilterOutfitsByItemForm;
