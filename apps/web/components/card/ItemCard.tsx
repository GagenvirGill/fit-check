
import { useState } from "react";
import { useSetAtom } from "jotai";
import { addNotificationAtom } from "@/jotai/notifications-atom";
import styles from "./ItemCard.module.css";
import { deleteItemAtom } from "@/jotai/items-atom";

import Card from "./Card";
import ItemContextMenuForms from "../popupForms/itemContextMenu/ItemContextMenuForms";
import ContextMenuButton from "../buttons/ContextMenuButton";

const ItemCard = ({ itemId, imagePath }) => {
	const addNotification = useSetAtom(addNotificationAtom);
	const deleteItem = useSetAtom(deleteItemAtom);
	const [showForm, setShowForm] = useState(false);

	const onDelete = async () => {
		try {
			await deleteItem(itemId);
			addNotification("Item Successfully Deleted!");
		} catch {
			addNotification(
				"An Error Occured while trying to Delete an Item!"
			);
		}
	};

	const handleShowForm = () => {
		setShowForm(true);
	};

	const handleCloseForm = () => {
		setShowForm(false);
	};

	return (
		<>
			<Card
				id={itemId}
				onDelete={onDelete}
				className={styles.itemCard}
				customConMenu={
					<ContextMenuButton
						onClick={handleShowForm}
						text="Manage Item's Categories"
					/>
				}
				type="Item"
			>
				<img src={imagePath} alt="Preview" id={itemId} />
			</Card>
			{showForm && (
				<ItemContextMenuForms
					itemId={itemId}
					imagePath={imagePath}
					handleClose={handleCloseForm}
				/>
			)}
		</>
	);
};

export default ItemCard;
