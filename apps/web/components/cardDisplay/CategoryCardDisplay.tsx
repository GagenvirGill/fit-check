
import { useAtomValue } from "jotai";
import { categoriesSortedByNameAscAtom } from "@/jotai/categories-atom";
import { itemsAtom } from "@/jotai/items-atom";
import styles from "./CardDisplayStyles.module.css";
import { Link } from "react-router-dom";
import attentionIcon from "@/assets/icons/attention.svg";

import CategoryCard from "../card/CategoryCard";
import BigButton from "../buttons/BigButton";

const CategoryCardDisplay = () => {
	const categories = useAtomValue(categoriesSortedByNameAscAtom);
	const items = useAtomValue(itemsAtom);

	return (
		<div className={styles.cardDisplay}>
			<Link to="/closet/all">
					<BigButton
						type="button"
						text="View All of Your Items"
						onClick={undefined}
					/>
			</Link>
			<br />
			<br />
			{categories.map((category) => {
				const item = items.find(
					(item) => item.itemId === category.favoriteItem
				);

				return (
					<CategoryCard
						key={`${category.categoryId}.card`}
						categoryId={category.categoryId}
						categoryName={category.name}
						urlRoute={`/closet/${category.name
							.toLowerCase()
							.replace(/\s+/g, "")}`}
						imagePath={
							item ? `${item.imagePath}` : attentionIcon
						}
						{...(item && { favItemId: item.itemId })}
					/>
				);
			})}
		</div>
	);
};

export default CategoryCardDisplay;
