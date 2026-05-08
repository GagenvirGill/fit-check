import { useEffect } from "react";
import type { ReactNode } from "react";
import { useSetAtom } from "jotai";
import type { BootstrapResponse } from "@fit-check/shared/types/contracts/bootstrap";
import type { ItemContract } from "@fit-check/shared/types/contracts/items";
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

const normalizeItem = (item: ItemContract): ItemContract => ({
	...item,
	imagePath: buildImageUrl(item.imagePath),
	createdAt: new Date(item.createdAt),
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

		const loadBootstrapData = async () => {
			try {
				const response = await apiFetchJson<BootstrapResponse>("/bootstrap");
				if (cancelled) {
					return;
				}

				setItems(response.items.map(normalizeItem));
				setCategories(response.categories);
				setOutfits(response.outfits);
				setItemCategoryLinks(response.itemCategoryLinks);
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

		void loadBootstrapData();

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
