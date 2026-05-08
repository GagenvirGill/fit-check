
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import styles from "../ContextMenuPopUpStyles.module.css";
import { categoriesForItemSelectorAtom } from "@/jotai/categories-atom";
import type { CategoryContract } from "@fit-check/shared/types/contracts/categories";

import Button from "@/components/buttons/Button";
import AddItemToCategoriesForm from "./AddItemToCategoriesForm";
import RemoveItemFromCategoriesForm from "./RemoveItemFromCategoriesForm";

type ItemContextMenuFormsProps = {
	itemId: string;
	imagePath: string;
	handleClose: () => void;
};

const ItemContextMenuForms = ({ itemId, imagePath, handleClose }: ItemContextMenuFormsProps) => {
	const getCategoriesForItem = useAtomValue(categoriesForItemSelectorAtom);
	const [itemsCurrCategories, setItemsCurrCategories] = useState<CategoryContract[]>([]);

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
