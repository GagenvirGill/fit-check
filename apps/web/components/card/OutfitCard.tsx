
import { useSetAtom } from "jotai";
import { addNotificationAtom } from "@/jotai/notifications-atom";
import styles from "./OutfitCard.module.css";
import { deleteOutfitAtom } from "@/jotai/outfits-atom";
import type { ItemContract } from "@fit-check/shared/types/contracts/items";
import type {
	OutfitLayoutContract,
	OutfitLayoutItemContract,
} from "@fit-check/shared/types/contracts/outfits";
import attentionIcon from "@/assets/icons/attention.svg";

import Card from "./Card";

const OutfitCard = ({
	outfitId,
	dateWorn,
	desc,
	layout,
	itemById,
}: {
	outfitId: string;
	dateWorn: string;
	desc: string | null;
	layout: OutfitLayoutContract;
	itemById: Map<string, ItemContract>;
}) => {
	const MAX_CARD_WIDTH = 290;
	const MAX_CARD_HEIGHT = 500;
	const addNotification = useSetAtom(addNotificationAtom);
	const deleteOutfit = useSetAtom(deleteOutfitAtom);
	const onDelete = async () => {
		try {
			await deleteOutfit(outfitId);
			addNotification(
				`Successfully Deleted Outfit Worn on ${dateWorn}!`
			);
		} catch {
			addNotification(
				`An Error Occurred while Deleting an Outfit Worn on ${dateWorn}!`
			);
		}
	};

	const sortedRows = layout;
	const totalWeight = sortedRows.reduce((sum, row) => {
		if (row.length === 0) {
			return sum;
		}
		const rowMax = Math.max(...row.map((item) => item.weight));
		return sum + rowMax;
	}, 0) || 1;

	const rowWidths: number[] = [];
	const rowMaxWidths: number[] = [];

	const rowSizes = sortedRows.map((row) => {
		const rowMaxWeight = Math.max(...row.map((item) => item.weight));
		const rowHeight = (rowMaxWeight / totalWeight) * MAX_CARD_HEIGHT;

		const imageRects = row.map((item) => {
			const itemMeta = itemById.get(item.itemId);
			const imageWidth = itemMeta?.imageWidth ?? 1;
			const imageHeight = itemMeta?.imageHeight ?? 1;
			const baseHeight = rowHeight * (item.weight / rowMaxWeight);
			const baseWidth = baseHeight * (imageWidth / imageHeight);
			return {
				width: baseWidth,
				height: baseHeight,
			};
		});

		const rowWidth = imageRects
			.map((dim) => dim.width)
			.reduce((sum, val) => sum + val, 0);
		rowWidths.push(rowWidth);

		let maxRowWidth;
		if (row.length === 0) {
			maxRowWidth = MAX_CARD_WIDTH;
		} else {
			let overlappedWidth = 0;
			let totalWidth = 0;

			for (let i = 0; i < imageRects.length; i++) {
				const current = imageRects[i];
				if (i === 0) {
					overlappedWidth += current.width;
				} else {
					const prev = imageRects[i - 1];
					overlappedWidth += current.width - 0.5 * prev.width;
				}

				totalWidth += imageRects[i].width;
			}

			const overlapRatio = totalWidth / overlappedWidth;
			maxRowWidth = MAX_CARD_WIDTH * overlapRatio;
		}

		rowMaxWidths.push(maxRowWidth);

		return imageRects;
	});

	const minScaleVals = rowWidths.map(
		(width, rowIdx) => rowMaxWidths[rowIdx] / width
	);
	const globalWidthScaler = Math.min(1, ...minScaleVals);

	const finalSizes = rowSizes.map((row) =>
		row.map((item) => ({
			width: item.width * globalWidthScaler,
			height: item.height * globalWidthScaler,
		}))
	);

	return (
		<>
			<Card
				id={outfitId}
				onDelete={onDelete}
				className={styles.outfitCard}
				customConMenu={null}
				type={`'${dateWorn}' Outfit`}
			>
				<div className={styles.outfitContainer}>
					{sortedRows.map((row: OutfitLayoutItemContract[], rowIdx: number) => {
						return (
							<div
								key={`${outfitId}-${rowIdx}`}
								className={styles.outfitRowContainer}
							>
								{row.map((item: OutfitLayoutItemContract, itemIdx: number) => {
									const itemMeta = itemById.get(item.itemId);
									return (
										<img
											key={`${outfitId}-${rowIdx}-${itemIdx}-${item.itemId}`}
											src={itemMeta?.imagePath ?? attentionIcon}
											alt="item-img"
											loading="lazy"
											style={{
												width: `${finalSizes[rowIdx][itemIdx].width}px`,
												height: `${finalSizes[rowIdx][itemIdx].height}px`,
												marginLeft:
													itemIdx !== 0
														? `-${
																finalSizes[
																	rowIdx
																][itemIdx - 1]
																	.width / 2
														  }px`
														: "0px",
											}}
										/>
									);
								})}
							</div>
						);
					})}
				</div>
				<div className={styles.outfitDate}>{dateWorn}</div>
				<div className={styles.outfitDesc}>{desc ?? ""}</div>
			</Card>
		</>
	);
};

export default OutfitCard;
