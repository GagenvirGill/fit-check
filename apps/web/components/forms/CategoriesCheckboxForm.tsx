import { useState } from "react";
import type { FormEvent } from "react";
import { useAtomValue } from "jotai";
import { categoriesSortedByNameAscAtom } from "@/jotai/categories-atom";
import type { CategoryContract } from "@fit-check/shared/types/contracts/categories";
import CheckboxButton from "../buttons/CheckboxButton";
import Button from "../buttons/Button";
import styles from "./FormStyles.module.css";

type CategoriesCheckboxFormProps = {
	handleSubmit: (selectedCategoryIds: string[]) => void | Promise<void>;
	displayCategories?: CategoryContract[];
	preSelectedCategoryIds?: string[];
	formId?: string;
};

const CategoriesCheckboxForm = ({
	handleSubmit,
	displayCategories,
	preSelectedCategoryIds,
	formId,
}: CategoriesCheckboxFormProps) => {
	const resolvedFormId = formId ?? "categories-checkbox-form";
	const allCategories = useAtomValue(categoriesSortedByNameAscAtom);
	const categories = displayCategories || allCategories;

	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		preSelectedCategoryIds ?? []
	);

	const handleCheckboxChange = (categoryId: string, checked: boolean) => {
		setSelectedCategories((prevState) => {
			if (checked) {
				return [...prevState, categoryId];
			} else {
				return prevState.filter((idVal) => idVal !== categoryId);
			}
		});
	};

	const handleCheckboxSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void handleSubmit(selectedCategories);
	};

	return (
		<form
				id={resolvedFormId}
				className={styles.form}
				onSubmit={handleCheckboxSubmit}
			>
				{categories.map((category) => (
					<CheckboxButton
						key={`${resolvedFormId}-${category.categoryId}`}
						text={category.name}
						buttonId={`${resolvedFormId}-${category.categoryId}`}
					onChange={(event) =>
						handleCheckboxChange(
							category.categoryId,
							event.target.checked
						)
					}
					checked={
						selectedCategories &&
						selectedCategories.includes(category.categoryId)
					}
				/>
			))}
			<br />
			<div className={styles.spacer}></div>
			<Button type={"submit"} text={"Submit"} />
		</form>
	);
};

export default CategoriesCheckboxForm;
