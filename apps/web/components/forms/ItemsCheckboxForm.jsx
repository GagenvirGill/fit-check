
import React, { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { itemsByCategoryIdsSelectorAtom, itemsSortedByCreatedAtAscAtom } from "@/jotai/items-atom";

import ImgCheckboxButton from "../buttons/ImgCheckboxButton";
import Button from "../buttons/Button";
import styles from "./FormStyles.module.css";

const ItemsCheckboxForm = ({
	handleSubmit,
	displayItems,
	filteringCategoryIds,
}) => {
	const allItems = useAtomValue(itemsSortedByCreatedAtAscAtom);
	const getItemsByCategoryIds = useAtomValue(itemsByCategoryIdsSelectorAtom);
	const [selectedItems, setSelectedItems] = useState([]);
	const [display_items, setDisplayItems] = useState(displayItems || allItems);

	const handleCheckboxChange = (itemId, checked) => {
		setSelectedItems((prevState) => {
			if (checked) {
				return [...prevState, itemId];
			} else {
				return prevState.filter((idVal) => idVal !== itemId);
			}
		});
	};

	const handleCheckboxSubmit = async (event) => {
		event.preventDefault();
		handleSubmit(selectedItems);
	};

	useEffect(() => {
		if (displayItems) {
			setDisplayItems(displayItems);
		} else if (!filteringCategoryIds) {
			setDisplayItems(allItems);
		}
	}, [displayItems, filteringCategoryIds, allItems]);

	useEffect(() => {
		if (filteringCategoryIds) {
			setDisplayItems(getItemsByCategoryIds(filteringCategoryIds));
		}
	}, [filteringCategoryIds, getItemsByCategoryIds]);

	return (
		<form className={styles.form} onSubmit={handleCheckboxSubmit}>
			{display_items.map((item) => (
				<ImgCheckboxButton
					key={item.itemId}
					buttonId={item.itemId}
					imgPath={item.imagePath}
					onChange={(e) => {
						handleCheckboxChange(item.itemId, e.target.checked);
					}}
				/>
			))}
			<br />
			<div className={styles.spacer}></div>
			<Button type={"submit"} text={"Submit"} />
		</form>
	);
};

export default ItemsCheckboxForm;
