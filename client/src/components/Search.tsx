import type React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useStore } from "@nanostores/react";
import { recordStore, searchRecords, clearSearch } from "../stores/records";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X } from "lucide-react";
import { useDebounce } from "@/utils/useDebounce";

export const Search: React.FC = () => {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, 300); // Debounce search to avoid too many requests
	const { isSearching } = useStore(recordStore);

	// Effect for debounced search
	useEffect(() => {
		if (debouncedQuery) {
			searchRecords(debouncedQuery);
		} else if (debouncedQuery === "") {
			clearSearch();
		}
	}, [debouncedQuery]);

	// Handle input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value);
	};

	// Handle clear search
	const handleClearSearch = () => {
		setQuery("");
		clearSearch();
	};

	return (
		<div className="mb-4 relative">
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Input
						placeholder="Search records..."
						value={query}
						onChange={handleSearchChange}
						className="w-full pl-9" // Make room for the search icon
					/>
					<SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					{query && (
						<button
							type="button"
							onClick={handleClearSearch}
							className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			{isSearching && (
				<div className="mt-2 text-sm text-muted-foreground">
					Showing search results. The tree view is filtered based on
					your query.
				</div>
			)}
		</div>
	);
};
