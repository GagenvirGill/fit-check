import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useAtomValue } from "jotai";
import { itemsByCategoryIdsSelectorAtom, itemsSortedByCreatedAtAscAtom } from "@/jotai/items-atom";
import styles from "./FormStyles.module.css";
import type { Item } from "@/types/item";

import ImgRadioButton from "../buttons/ImgRadioButton";
import Button from "../buttons/Button";

type ItemsRadioFormProps = {
	handleSubmit: (selectedItemId: string, selectedItemImagePath?: string | null) => void | Promise<void>;
	preSelectedItemId?: string;
	formId: string;
	returnImagePath?: boolean;
	filteringCategoryIds?: string[];
};

const ItemsRadioForm = ({
	handleSubmit,
	preSelectedItemId,
	formId,
	returnImagePath,
	filteringCategoryIds,
}: ItemsRadioFormProps) => {
	const allItems = useAtomValue(itemsSortedByCreatedAtAscAtom);
	const getItemsByCategoryIds = useAtomValue(itemsByCategoryIdsSelectorAtom);
	const [displayItems, setDisplayItems] = useState<Item[]>([]);

	useEffect(() => {
		if (filteringCategoryIds) {
			if (filteringCategoryIds.length === 0) {
				setDisplayItems(allItems);
			} else {
				setDisplayItems(getItemsByCategoryIds(filteringCategoryIds));
			}
		}
	}, [filteringCategoryIds, allItems, getItemsByCategoryIds]);

	const [selectedItemId, setSelectedItemId] = useState(preSelectedItemId);
	const [selectedItemImagePath, setSelectedItemImagePath] = useState<string | null>(null);

	const handleRadioChange = (item: Item) => {
		setSelectedItemId(item.itemId);
		if (returnImagePath) {
			setSelectedItemImagePath(item.imagePath);
		}
	};

	const handleRadioSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!selectedItemId) {
			return;
		}
		if (returnImagePath) {
			void handleSubmit(selectedItemId, selectedItemImagePath);
		} else {
			void handleSubmit(selectedItemId);
		}
	};

	return (
		<form className={styles.form} onSubmit={handleRadioSubmit}>
			{displayItems.map((item) => (
				<ImgRadioButton
					key={`${formId}-${item.itemId}`}
					buttonId={item.itemId}
					imgPath={item.imagePath}
					isSelected={selectedItemId === item.itemId}
					onChange={() => handleRadioChange(item)}
					formId={`${formId}-uniqueID`}
				/>
			))}
			<br />
			<div className={styles.spacer}></div>
			<Button type={"submit"} text={"Submit"} />
		</form>
	);
};

export default ItemsRadioForm;
