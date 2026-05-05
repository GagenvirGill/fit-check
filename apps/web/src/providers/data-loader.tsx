
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useSetAtom } from "jotai";
import { getBootstrapData } from "@/api/actions/bootstrap";
import { useAuth } from "@/providers/auth/useAuth";
import { itemsAtom, itemsLoadingAtom } from "@/jotai/items-atom";
import { categoriesAtom, categoriesLoadingAtom } from "@/jotai/categories-atom";
import { outfitsAtom, outfitsLoadingAtom } from "@/jotai/outfits-atom";

interface DataLoaderProps {
	children: ReactNode;
}

export default function DataLoader({ children }: DataLoaderProps) {
	const { isAuthenticated, loading: authLoading } = useAuth();

	const setItems = useSetAtom(itemsAtom);
	const setItemsLoading = useSetAtom(itemsLoadingAtom);
	const setCategories = useSetAtom(categoriesAtom);
	const setCategoriesLoading = useSetAtom(categoriesLoadingAtom);
	const setOutfits = useSetAtom(outfitsAtom);
	const setOutfitsLoading = useSetAtom(outfitsLoadingAtom);

	useEffect(() => {
		if (authLoading) {
			return;
		}

		if (!isAuthenticated) {
			setItems([]);
			setCategories([]);
			setOutfits([]);
			setItemsLoading(false);
			setCategoriesLoading(false);
			setOutfitsLoading(false);
			return;
		}

		setItemsLoading(true);
		setCategoriesLoading(true);
		setOutfitsLoading(true);

		void getBootstrapData()
			.then((data) => {
				setItems(data.items);
				setCategories(data.categories);
				setOutfits(data.outfits);
			})
			.catch((error) => {
				console.error("Error loading bootstrap data:", error);
				setItems([]);
				setCategories([]);
				setOutfits([]);
			})
			.finally(() => {
				setItemsLoading(false);
				setCategoriesLoading(false);
				setOutfitsLoading(false);
			});
	}, [authLoading, isAuthenticated, setItems, setCategories, setOutfits, setItemsLoading, setCategoriesLoading, setOutfitsLoading]);

	return children;
}
