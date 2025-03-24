import { useState, useEffect } from "react";

/**
 * A custom hook that debounces a value.
 *
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		// Set a timeout to update the debounced value after the specified delay
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// Clear the timeout if value changes before the delay expires
		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}
