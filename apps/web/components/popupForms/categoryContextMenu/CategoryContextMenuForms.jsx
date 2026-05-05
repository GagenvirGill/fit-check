
import React, { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import styles from "../ContextMenuPopUpStyles.module.css";

import { itemsByCategoryIdsSelectorAtom } from "@/jotai/items-atom";

import Button from "@/components/buttons/Button";
import AddCategoryToItemsForm from "./AddCategoryToItemsForm";
import RemoveCategoryFromItemsForm from "./RemoveCategoryFromItemsForm";

const CategoryContextMenuForms = ({
	categoryId,
	categoryName,
	handleClose,
}) => {
	const getItemsByCategoryIds = useAtomValue(itemsByCategoryIdsSelectorAtom);
	const [categoriesCurrItems, setCategoriesCurrItems] = useState([]);

	useEffect(() => {
		setCategoriesCurrItems(getItemsByCategoryIds([categoryId]));
	}, [categoryId, getItemsByCategoryIds]);

	return (
		<>
			<div className={styles.overlay}></div>
			<div className={styles.popupForm}>
				<br />
				<Button onClick={handleClose} text={"Cancel"} />
				<br />
				<br />
				<p className={styles.title}>{categoryName}</p>
				<AddCategoryToItemsForm
					categoryId={categoryId}
					categoryName={categoryName}
					handleClose={handleClose}
					categoriesCurrItems={categoriesCurrItems}
				/>
				<br />
				<br />
				<RemoveCategoryFromItemsForm
					categoryId={categoryId}
					handleClose={handleClose}
					categoriesCurrItems={categoriesCurrItems}
					categoryName={categoryName}
				/>
				<br />
			</div>
		</>
	);
};

export default CategoryContextMenuForms;
