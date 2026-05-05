
import React, { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import styles from "../ContextMenuPopUpStyles.module.css";
import { categoriesForItemSelectorAtom } from "@/jotai/categories-atom";

import Button from "@/components/buttons/Button";
import AddItemToCategoriesForm from "./AddItemToCategoriesForm";
import RemoveItemFromCategoriesForm from "./RemoveItemFromCategoriesForm";

const ItemContextMenuForms = ({ itemId, imagePath, handleClose }) => {
	const getCategoriesForItem = useAtomValue(categoriesForItemSelectorAtom);
	const [itemsCurrCategories, setItemsCurrCategories] = useState([]);

	useEffect(() => {
		setItemsCurrCategories(getCategoriesForItem(itemId));
	}, [itemId, getCategoriesForItem]);

	return (
		<>
			<div className={styles.overlay}></div>
			<div className={styles.popupForm}>
				<br />
				<Button onClick={handleClose} text={"Cancel"} />
				<br />
				<br />
				<img
					src={imagePath}
					alt="Preview"
					id={`${itemId}-ItemCM`}
					className={styles.popupImage}
				/>
				<AddItemToCategoriesForm
					itemId={itemId}
					handleClose={handleClose}
					itemsCurrCategories={itemsCurrCategories}
				/>
				<br />
				<hr />
				<RemoveItemFromCategoriesForm
					itemId={itemId}
					handleClose={handleClose}
					itemsCurrCategories={itemsCurrCategories}
				/>
				<br />
			</div>
		</>
	);
};

export default ItemContextMenuForms;
