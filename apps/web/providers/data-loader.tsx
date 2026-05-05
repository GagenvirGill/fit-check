import { useEffect } from "react";
import type { ReactNode } from "react";
import { useSetAtom } from "jotai";
import type { BootstrapResponse } from "@fit-check/shared/types/contracts/bootstrap";
import { adaptBootstrapResponse } from "@/lib/adapters/bootstrap";
import { apiFetchJson } from "@/lib/api-fetch";
import { categoriesAtom } from "@/jotai/categories-atom";
import { itemCategoryLinksAtom } from "@/jotai/item-category-links-atom";
import { itemsAtom } from "@/jotai/items-atom";
import { outfitsAtom } from "@/jotai/outfits-atom";
import { useAuth } from "@/providers/auth/useAuth";

interface DataLoaderProps {
	children: ReactNode;
}

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

				const data = adaptBootstrapResponse(response);
				setItems(data.items);
				setCategories(data.categories);
				setOutfits(data.outfits);
				setItemCategoryLinks(data.itemCategoryLinks);
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
