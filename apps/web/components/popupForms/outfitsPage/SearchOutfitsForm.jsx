
import React, { useState } from "react";
import { useAtomValue } from "jotai";
import { outfitsSortedByDateWornAscAtom, searchOutfitsByDescriptionSelectorAtom } from "@/jotai/outfits-atom";
import styles from "./SearchOutfitsForm.module.css";

const SearchOutfitsForm = ({ setDisplayedOutfits }) => {
	const outfits = useAtomValue(outfitsSortedByDateWornAscAtom);
	const searchOutfits = useAtomValue(searchOutfitsByDescriptionSelectorAtom);
	const [query, setQuery] = useState("");

	const handleSearch = () => {
		if (query.trim() === "") {
			setDisplayedOutfits(outfits);
		} else {
			const queriedOutfits = searchOutfits(query);
			setDisplayedOutfits(queriedOutfits);
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	return (
		<input
			type="text"
			id="search-query"
			className={styles.textInput}
			value={query}
			onChange={(e) => setQuery(e.target.value)}
			onKeyDown={handleKeyDown}
			placeholder="Search outfits by description"
		/>
	);
};

export default SearchOutfitsForm;
