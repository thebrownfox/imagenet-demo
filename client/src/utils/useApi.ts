import { ofetch } from "ofetch";
import { useState, useCallback, useEffect, useRef } from "react";

// Types for API responses and options
export interface ApiResponse<T> {
	data: T | null;
	isLoading: boolean;
	error: Error | null;
	fetch: <U = T>(url: string, options?: ApiOptions) => Promise<U>;
}

export interface ApiOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	body?: any;
	headers?: Record<string, string>;
	params?: Record<string, string | number | boolean>;
	immediate?: boolean; // If true, fetch when hook mounts
}

/**
 * React hook for API calls
 *
 * This hook provides a convenient way to fetch data from APIs in React components
 * with automatic loading state and error handling.
 *
 * @param initialUrl - The URL to fetch data from. Can be empty if you plan to call fetch manually.
 * @param initialOptions - Configuration options for the API request
 *
 * @returns An object containing:
 *   - data: The fetched data (null before the first successful fetch)
 *   - isLoading: Boolean indicating if a request is in progress
 *   - error: Error object if the request failed, null otherwise
 *   - fetch: Function to manually trigger a fetch request
 *
 * @example Basic usage
 * ```tsx
 * const { data, isLoading, error } = useApi<User[]>('/api/users', { immediate: true });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <UserList users={data || []} />;
 * ```
 *
 * @example Manual fetch with parameters
 * ```tsx
 * const { data, isLoading, fetch } = useApi<SearchResults>();
 *
 * // Call fetch manually, such as in an event handler
 * const handleSearch = (query: string) => {
 *   fetch('/api/search', {
 *     params: { q: query },
 *     method: 'GET'
 *   });
 * };
 * ```
 *
 * @example POST request with body
 * ```tsx
 * const { fetch, isLoading } = useApi<User>();
 *
 * const handleSubmit = (userData: UserFormData) => {
 *   fetch('/api/users', {
 *     method: 'POST',
 *     body: userData
 *   }).then(response => {
 *     // Handle successful response
 *   });
 * };
 * ```
 */
export const useApi = <T = any>(
	initialUrl = "",
	initialOptions: ApiOptions = {},
): ApiResponse<T> => {
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	// Use refs to prevent dependency changes causing infinite loops
	const optionsRef = useRef(initialOptions);
	const urlRef = useRef(initialUrl);

	// Update refs if values change
	useEffect(() => {
		urlRef.current = initialUrl;
		optionsRef.current = initialOptions;
	}, [initialUrl, initialOptions]);

	const fetch = useCallback(
		async <U = T>(
			url: string = urlRef.current,
			options: ApiOptions = {},
		): Promise<U> => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await ofetch<U>(url, {
					method:
						options.method || optionsRef.current.method || "GET",
					body: options.body || optionsRef.current.body,
					headers: {
						...optionsRef.current.headers,
						...options.headers,
					},
					params: { ...optionsRef.current.params, ...options.params },
				});

				setData(response as unknown as T);
				setIsLoading(false);
				return response;
			} catch (err) {
				const errorObj =
					err instanceof Error ? err : new Error(String(err));
				setError(errorObj);
				setIsLoading(false);
				throw errorObj;
			}
		},
		[], // Empty dependency array to ensure stability
	);

	// Track whether initial fetch has been performed
	const initialFetchPerformed = useRef(false);

	// Separate effect for initial fetch to prevent loops
	useEffect(() => {
		// Only fetch if immediate is true and we haven't already fetched
		if (
			optionsRef.current.immediate &&
			initialUrl &&
			!initialFetchPerformed.current
		) {
			initialFetchPerformed.current = true;
			fetch(initialUrl).catch(() => {
				// Error already handled in fetch
			});
		}
	}, [initialUrl, fetch]);

	return { data, isLoading, error, fetch };
};

/**
 * Factory function to create pre-configured API clients
 *
 * @param baseUrl - The base URL for all API requests
 * @param defaultOptions - Default options to be applied to all requests
 *
 * @returns An object with two methods:
 *   - useApi: A hook for use in React components
 *   - fetch: A function for use outside React (e.g., in stores)
 *
 * @example Creating a configured API client
 * ```tsx
 * const api = createApi('https://api.example.com', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 *
 * // Use in a React component
 * const UserProfile = () => {
 *   const { data } = api.useApi<UserProfile>('/profile', { immediate: true });
 *   return data ? <div>{data.name}</div> : <Spinner />;
 * }
 *
 * // Use in a store or non-React context
 * const fetchData = async () => {
 *   const result = await api.fetch<UserData>('/users/123');
 *   return result;
 * }
 * ```
 */
export const createApi = (baseUrl: string, defaultOptions: ApiOptions = {}) => {
	return {
		// For React components
		useApi: <T>(
			endpoint = "",
			options: ApiOptions = {},
		): ApiResponse<T> => {
			const url = endpoint ? `${baseUrl}${endpoint}` : baseUrl;
			return useApi<T>(url, { ...defaultOptions, ...options });
		},

		// For use outside React (e.g., nanostores)
		fetch: async <T>(
			endpoint: string,
			options: ApiOptions = {},
		): Promise<T> => {
			const url = endpoint ? `${baseUrl}${endpoint}` : baseUrl;
			return ofetch<T>(url, {
				method: options.method || defaultOptions.method || "GET",
				body: options.body || defaultOptions.body,
				headers: { ...defaultOptions.headers, ...options.headers },
				params: { ...defaultOptions.params, ...options.params },
			});
		},
	};
};
