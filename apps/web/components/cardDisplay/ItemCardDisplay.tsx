
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { itemsByCategoryIdsSelectorAtom, itemsSortedByCreatedAtAscAtom } from "@/jotai/items-atom";
import { outfitsAtom } from "@/jotai/outfits-atom";
import styles from "./CardDisplayStyles.module.css";

import Button from "../buttons/Button";
import ItemCard from "../card/ItemCard";
import ItemSortByForm from "../popupForms/itemsPage/ItemSortByForm";

const calculateLoadAmount = () => {
	if (typeof window === "undefined") {return 20;}
	const baseAmount = Math.floor((window.innerWidth * 0.9) / 160) * 4;
	return baseAmount > 40 ? baseAmount / 2 : baseAmount;
};

const getLastWornMap = (outfits) => {
	const dateWornMap = new Map();

	for (const outfit of outfits) {
		const outfitDateWorn = new Date(outfit.dateWorn);
		for (const row of outfit.layout) {
			for (const layoutItem of row) {
				const itemId = layoutItem.itemId;
				const existing = dateWornMap.get(itemId);
				if (!existing || existing < outfitDateWorn) {
					dateWornMap.set(itemId, outfitDateWorn);
				}
			}
		}
	}

	return dateWornMap;
};

const getWearCountMap = (outfits) => {
	const wearCountMap = new Map();
	for (const outfit of outfits) {
		for (const row of outfit.layout) {
			for (const layoutItem of row) {
				const itemId = layoutItem.itemId;
				wearCountMap.set(itemId, (wearCountMap.get(itemId) || 0) + 1);
			}
		}
	}
	return wearCountMap;
};

const sortItemsByOption = (outfits, items, sortOption) => {
	switch (sortOption) {
		case "lastWornDateAsc": {
			const lastWornMap = getLastWornMap(outfits);
			return [...items].sort((a, b) => {
				const dateA = lastWornMap.get(a.itemId) || new Date(0);
				const dateB = lastWornMap.get(b.itemId) || new Date(0);
				return dateA - dateB;
			});
		}
		case "lastWornDateDesc": {
			const lastWornMap = getLastWornMap(outfits);
			return [...items].sort((a, b) => {
				const dateA = lastWornMap.get(a.itemId) || new Date(0);
				const dateB = lastWornMap.get(b.itemId) || new Date(0);
				return dateB - dateA;
			});
		}
		case "amountWornAsc": {
			const wearCountMap = getWearCountMap(outfits);
			return [...items].sort((a, b) => (wearCountMap.get(a.itemId) || 0) - (wearCountMap.get(b.itemId) || 0));
		}
		case "amountWornDesc": {
			const wearCountMap = getWearCountMap(outfits);
			return [...items].sort((a, b) => (wearCountMap.get(b.itemId) || 0) - (wearCountMap.get(a.itemId) || 0));
		}
		default:
			return items;
	}
};

const ItemCardDisplay = ({ selectedCategories }) => {
	const allItems = useAtomValue(itemsSortedByCreatedAtAscAtom);
	const outfits = useAtomValue(outfitsAtom);
	const getItemsByCategoryIds = useAtomValue(itemsByCategoryIdsSelectorAtom);
	const [visibleCount, setVisibleCount] = useState(calculateLoadAmount());
	const [sortOption, setSortOption] = useState("none");

	const baseItems =
		selectedCategories && selectedCategories.length > 0
			? getItemsByCategoryIds(selectedCategories)
			: allItems;

	const sortedDisplayItems =
		sortOption === "none"
			? baseItems
			: sortItemsByOption(outfits, baseItems, sortOption);

	const handleLoadMore = () => {
		setVisibleCount((prev) => prev + calculateLoadAmount());
	};

	useEffect(() => {
		setVisibleCount(calculateLoadAmount());
	}, [selectedCategories, sortOption]);

	useEffect(() => {
		const handleUpdateLoadAmount = () => {
			const newAmount = calculateLoadAmount();
			setVisibleCount(newAmount);
		};

		window.addEventListener("resize", handleUpdateLoadAmount);
		return () =>
			window.removeEventListener("resize", handleUpdateLoadAmount);
	}, []);

	return (
		<>
			<ItemSortByForm setSortOption={setSortOption} />
			<br />
			<br />
			<div className={styles.cardDisplay}>
				{sortedDisplayItems.slice(0, visibleCount).map((item) => (
					<ItemCard
						key={`${item.itemId}-${selectedCategories}`}
						itemId={item.itemId}
						imagePath={item.imagePath}
					/>
				))}
			</div>
			<br />
			{visibleCount < sortedDisplayItems.length && (
				<Button
					type="submit"
					text="Load More"
					onClick={handleLoadMore}
				/>
			)}
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
		</>
	);
};

export default ItemCardDisplay;
