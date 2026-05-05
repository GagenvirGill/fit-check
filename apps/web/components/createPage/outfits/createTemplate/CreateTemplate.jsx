
import React, { useState, useMemo } from "react";
import styles from "./CreateTemplate.module.css";
import { useAtomValue, useSetAtom } from "jotai";
import { outfitsAtom } from "@/jotai/outfits-atom";
import { templateRowsAtom, setWholeTemplateAtom } from "@/jotai/outfit-template-atom";
import { randomItemForCategoryIdsSelectorAtom } from "@/jotai/items-atom";
import {
	createAdjacencyMatrix,
	updateTemplateWithScales,
} from "@/lib/item-ratios";

import TemplateRow from "./TemplateRow";
import ImgButton from "@/components/buttons/ImgButton";
import CreateOutfitForm from "@/components/popupForms/templatePopups/CreateOutfitForm";

const CreateTemplate = () => {
	const outfits = useAtomValue(outfitsAtom);
	const templateRows = useAtomValue(templateRowsAtom);
	const getRandomItem = useAtomValue(randomItemForCategoryIdsSelectorAtom);
	const setWholeTemplate = useSetAtom(setWholeTemplateAtom);
	const ratiosMatrix = useMemo(() => {
		return createAdjacencyMatrix(outfits);
	}, [outfits]);
	const [showCreateOutfitForm, setShowCreateOutfitForm] = useState(false);

	const handleRandomizationAll = (e) => {
		e.preventDefault();
		e.stopPropagation();

		const results = templateRows.map((row) =>
			row.map((templateBox) =>
				handleTemplateBoxRandomization(
					templateBox.isLocked,
					templateBox.categories
				)
			)
		);

		const newRows = updateTemplateWithScales(
			templateRows,
			ratiosMatrix,
			results
		);

		setWholeTemplate({ newTemplate: newRows });
	};

	const handleRandomizationOne = (rowIndex, boxIndex) => {
		const box = templateRows[rowIndex][boxIndex];

		const result = handleTemplateBoxRandomization(
			box.isLocked,
			box.categories
		);

		if (result && result.itemId) {
			const newRows = templateRows.map((row) => [...row]);

			newRows[rowIndex][boxIndex] = {
				...newRows[rowIndex][boxIndex],
				itemId: result.itemId,
				imagePath: result.imagePath,
			};

			const updatedRows = updateTemplateWithScales(
				newRows,
				ratiosMatrix,
				newRows
			);

			setWholeTemplate({ newTemplate: updatedRows });
		}
	};

	const handleTemplateBoxRandomization = (isLocked, categories) => {
		if (isLocked) {
			return;
		}

		const item = getRandomItem(categories);
		if (!item) {
			return;
		}

		return {
			itemId: item.itemId,
			imagePath: item.imagePath,
		};
	};

	const handleCreateOutfit = async (e) => {
		e.preventDefault();
		e.stopPropagation();

		setShowCreateOutfitForm(true);
	};

	const handleClearTemplate = (e) => {
		e.preventDefault();
		e.stopPropagation();

		setWholeTemplate({ newTemplate: [] });
	};

	return (
		<>
			<div className={styles.createTemplateContainer}>
				<div className={styles.inlineButtons}>
					<ImgButton
						buttonId="outfit-template-create-button"
						imgFileName="/checkmark_icon.png"
						onClick={handleCreateOutfit}
					/>
					<ImgButton
						buttonId="outfit-template-randomize-button"
						imgFileName="/shuffle_icon.png"
						onClick={handleRandomizationAll}
					/>
					<ImgButton
						buttonId="outfit-template-clear-button"
						imgFileName="/trash_icon.png"
						onClick={handleClearTemplate}
					/>
				</div>

				<br />
				{templateRows.map((_, rowIndex) => (
					<TemplateRow
						key={`templaterow-${rowIndex}`}
						rowIndex={rowIndex}
						handleRandomizationOne={handleRandomizationOne}
						ratiosMatrix={ratiosMatrix}
					/>
				))}
			</div>

			{showCreateOutfitForm && (
				<CreateOutfitForm
					setShowCreateOutfitForm={setShowCreateOutfitForm}
				/>
			)}
		</>
	);
};

export default CreateTemplate;
