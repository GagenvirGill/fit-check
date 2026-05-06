
import styles from "../ContextMenuPopUpStyles.module.css";
import { useSetAtom } from "jotai";
import { addNotificationAtom } from "@/jotai/notifications-atom";
import { removeCategoryFromItemsAtom } from "@/jotai/categories-atom";

import ItemsCheckboxForm from "@/components/forms/ItemsCheckboxForm";

const RemoveCategoryFromItemsForm = ({
	categoryId,
	handleClose,
	categoriesCurrItems,
	categoryName,
}) => {
	const addNotification = useSetAtom(addNotificationAtom);
	const removeCategoryFromItems = useSetAtom(removeCategoryFromItemsAtom);
	const handleSubmit = async (selectedItems) => {
		try {
			await removeCategoryFromItems({
				categoryId,
				itemIds: selectedItems,
			});
			handleClose();
			addNotification(
				`Successfully Removed Items from the '${categoryName}' Category!`
			);
		} catch {
			addNotification(
				`An Error Occured Trying to Remove Items from a Category!`
			);
		}
	};

	return (
		<div>
			<p className={styles.formTitle}>
				Select Which Items to Remove from this Category
			</p>
			<ItemsCheckboxForm
				handleSubmit={handleSubmit}
				displayItems={categoriesCurrItems}
			/>
		</div>
	);
};

export default RemoveCategoryFromItemsForm;
