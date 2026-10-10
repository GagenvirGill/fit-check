import { useEffect } from "react";
import type { ReactNode } from "react";
import { useSetAtom } from "jotai";
import type { ListCategoriesResponse } from "@packages/contracts/category";
import type { ItemResponse, ListItemsResponse } from "@packages/contracts/item";
import type { ListOutfitsResponse } from "@packages/contracts/outfit";
import { apiFetchJson } from "@/lib/api-fetch";
import { buildImageUrl } from "@/lib/image-url";
import { categoriesAtom } from "@/jotai/categories-atom";
import { itemCategoryLinksAtom } from "@/jotai/item-category-links-atom";
import { itemsAtom } from "@/jotai/items-atom";
import { outfitsAtom } from "@/jotai/outfits-atom";
import { useAuth } from "@/providers/auth/useAuth";

interface DataLoaderProps {
	children: ReactNode;
}

const normalizeItem = ({ categoryIds: _categoryIds, ...item }: ListItemsResponse[number]): ItemResponse => ({
	...item,
	imagePath: buildImageUrl(item.imagePath),
});

export default function DataLoader({ children }: DataLoaderProps) {
	const { isAuthenticated, loading: authLoading } = useAuth();
	
	const setItems = useSetAtom(itemsAtom);
	const setCategories = useSetAtom(categoriesAtom);
	const setOutfits = useSetAtom(outfitsAtom);
	const setItemCategoryLinks = useSetAtom(itemCategoryLinksAtom);

	useEffect(() => {
		let cancelled = false;

		if (authLoading) {
			return;
		}

		if (!isAuthenticated) {
			setItems([]);
			setCategories([]);
			setOutfits([]);
			setItemCategoryLinks([]);
			return;
		}

		const loadData = async () => {
			try {
				const [items, categories, outfits] = await Promise.all([
					apiFetchJson<ListItemsResponse>("/items"),
					apiFetchJson<ListCategoriesResponse>("/categories"),
					apiFetchJson<ListOutfitsResponse>("/outfits"),
				]);
				if (cancelled) {
					return;
				}

				setItems(items.map(normalizeItem));
				setCategories(categories);
				setOutfits(outfits);
				setItemCategoryLinks(
					items.flatMap((item) =>
						item.categoryIds.map((categoryId) => ({ itemId: item.itemId, categoryId }))
					)
				);
			} catch {
				if (cancelled) {
					return;
				}
				setItems([]);
				setCategories([]);
				setOutfits([]);
				setItemCategoryLinks([]);
			}
		};

		void loadData();

		return () => {
			cancelled = true;
		};
	}, [
		authLoading,
		isAuthenticated,
		setCategories,
		setItemCategoryLinks,
		setItems,
		setOutfits,
	]);

	return children;
}
