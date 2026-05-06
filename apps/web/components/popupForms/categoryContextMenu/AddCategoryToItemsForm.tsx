
import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { itemsSortedByCreatedAtAscAtom } from "@/jotai/items-atom";
import { addNotificationAtom } from "@/jotai/notifications-atom";
import styles from "../ContextMenuPopUpStyles.module.css";
import { addCategoryToItemsAtom } from "@/jotai/categories-atom";
import type { Item } from "@/types/item";

import ItemsCheckboxForm from "@/components/forms/ItemsCheckboxForm";

type AddCategoryToItemsFormProps = {
	categoryId: string;
	handleClose: () => void;
	categoriesCurrItems: Item[];
	categoryName: string;
};

const AddCategoryToItemsForm = ({
	categoryId,
	handleClose,
	categoriesCurrItems,
	categoryName,
}: AddCategoryToItemsFormProps) => {
	const addNotification = useSetAtom(addNotificationAtom);
	const addCategoryToItems = useSetAtom(addCategoryToItemsAtom);
	const items = useAtomValue(itemsSortedByCreatedAtAscAtom);
	const [filteredItems, setFilteredItems] = useState<Item[]>([]);

	useEffect(() => {
		const currItems = new Set<string>();
		categoriesCurrItems.forEach((item) => {
			currItems.add(item.itemId);
		});

		const filtItems = items.filter((item) => {
			return !currItems.has(item.itemId);
		});

		setFilteredItems(filtItems);
	}, [items, categoriesCurrItems]);

	const handleSubmit = async (selectedItems: string[]) => {
		try {
			await addCategoryToItems({
				categoryId,
				itemIds: selectedItems,
			});
			handleClose();
			addNotification(
				`Successfully Added Items to the '${categoryName}' Category!`
			);
		} catch {
			addNotification(
				`An Error Occured Trying to Add Items to a Category!`
			);
		}
	};

	return (
		<div>
			<p className={styles.formTitle}>
				Select Which Items to Add to this Category
			</p>
			<ItemsCheckboxForm
				handleSubmit={handleSubmit}
				displayItems={filteredItems}
			/>
		</div>
	);
};

export default AddCategoryToItemsForm;
