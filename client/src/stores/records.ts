import { atom, deepMap } from "nanostores";
import type { TreeNodeOutput } from "server/api/records/index.get";
import { createApi } from "@/utils/useApi";

export type TreeViewNode = TreeNodeOutput & {
	// NOTE: flag to control if the node is expanded
	treeId: string; // Use name as ID for tree view component
	expanded?: boolean;
	loading?: boolean; // Track loading state for each node
	children?: TreeViewNode[];
};

// Create an API instance for record operations
const recordsApi = createApi("");

// Function to transform API data to TreeViewNode format
const transformApiData = (nodes: TreeNodeOutput[]): TreeViewNode[] => {
	return nodes.map((node) => ({
		...node,
		// NOTE: Use name as ID for tree view component and we assume that the name is unique for each node
		treeId: node.name,
		// NOTE: We append size to name here as the tree view component doesn't have slot
		name: `${node.name} (${node.size})`,
		expanded: false,
		loading: false,
		children: node.children ? transformApiData(node.children) : [],
	}));
};

// Store with empty initial data - will be populated from API
export const recordStore = deepMap<{
	data: TreeViewNode[];
	originalData: TreeViewNode[]; // Store original data for returning from search
	isSearching: boolean;
}>({
	data: [],
	originalData: [],
	isSearching: false,
});

// Function to load data from API and update stores
export const loadRecords = async () => {
	try {
		// Only fetch if store is empty
		if (recordStore.get().data.length === 0) {
			console.log("Loading root records from API...");
			const apiData =
				await recordsApi.fetch<TreeNodeOutput[]>("/api/records");

			// Transform API data to match our store format
			const transformedData = transformApiData(apiData);

			// Update both stores
			recordStore.set({
				data: transformedData,
				originalData: transformedData, // Keep a copy of original data
				isSearching: false,
			});
			console.log("Root records loaded successfully");
		}
	} catch (error) {
		console.error("Failed to load root records:", error);
	}
};

// Function to search records
export const searchRecords = async (query: string) => {
	try {
		if (!query.trim()) {
			// If query is empty, restore original data
			const { originalData } = recordStore.get();
			recordStore.set({
				data: originalData,
				originalData,
				isSearching: false,
			});
			return;
		}

		console.log(`Searching records with query: ${query}`);

		// Fetch search results from API
		const searchResults = await recordsApi.fetch<TreeNodeOutput[]>(
			"/api/records",
			{
				params: { search: query },
			},
		);

		// Transform search results
		const transformedResults = transformApiData(searchResults);

		// Keep original data but display search results
		const { originalData } = recordStore.get();
		recordStore.set({
			data: transformedResults,
			originalData,
			isSearching: true,
		});

		console.log(
			`Search completed with ${transformedResults.length} results`,
		);
	} catch (error) {
		console.error(`Search failed: ${error}`);
		// If search fails, show original data
		const { originalData } = recordStore.get();
		recordStore.set({
			data: originalData,
			originalData,
			isSearching: false,
		});
	}
};

// Function to clear search results and return to normal view
export const clearSearch = () => {
	const { originalData } = recordStore.get();
	recordStore.set({
		data: originalData,
		originalData,
		isSearching: false,
	});
};

// Function to load children for a specific node
export const loadNodeChildren = async (nodeName: string) => {
	try {
		console.log(`Loading children for node: ${nodeName}`);
		// Set loading state for this node
		updateNodeLoadingState(nodeName, true);

		// Fetch children with parentName parameter
		const childrenData = await recordsApi.fetch<TreeNodeOutput[]>(
			"/api/records",
			{
				params: { parentName: nodeName },
			},
		);

		// Transform the children data
		const transformedChildren = transformApiData(childrenData || []);

		// Update the node with its children
		updateNodeWithChildren(nodeName, transformedChildren);
		console.log(`Children for ${nodeName} loaded successfully`);
	} catch (error) {
		console.error(`Failed to load children for ${nodeName}:`, error);
	} finally {
		// Reset loading state
		updateNodeLoadingState(nodeName, false);
	}
};

// Helper function to update a node's loading state
const updateNodeLoadingState = (nodeName: string, loading: boolean) => {
	const currentState = recordStore.get();
	const { data: currentData, originalData, isSearching } = currentState;

	// Helper to recursively find and update the node
	const updateNode = (nodes: TreeViewNode[]): TreeViewNode[] => {
		return nodes.map((node) => {
			if (node.treeId === nodeName) {
				return { ...node, loading };
			}
			if (node.children && node.children.length > 0) {
				return { ...node, children: updateNode(node.children) };
			}
			return node;
		});
	};

	// Update data (the currently displayed nodes)
	const updatedData = updateNode(currentData);

	// If we're not in search mode, also update originalData
	if (!isSearching) {
		recordStore.set({
			data: updatedData,
			originalData: updateNode(originalData), // Apply the same update to originalData
			isSearching,
		});
	} else {
		// If we're in search mode, only update the displayed data
		recordStore.set({
			data: updatedData,
			originalData, // Keep originalData unchanged
			isSearching,
		});
	}
};

// Helper function to update a node with its loaded children
const updateNodeWithChildren = (nodeName: string, children: TreeViewNode[]) => {
	const currentState = recordStore.get();
	const { data: currentData, originalData, isSearching } = currentState;

	// Helper to recursively find and update the node
	const updateNode = (nodes: TreeViewNode[]): TreeViewNode[] => {
		return nodes.map((node) => {
			if (node.treeId === nodeName) {
				return {
					...node,
					children,
					expanded: true,
				};
			}
			if (node.children && node.children.length > 0) {
				return { ...node, children: updateNode(node.children) };
			}
			return node;
		});
	};

	// Update data (the currently displayed nodes)
	const updatedData = updateNode(currentData);
	console.log("updated data:", updatedData);

	// If we're not in search mode, also update originalData and categoriesStore
	if (!isSearching) {
		const updatedOriginalData = updateNode(originalData);
		recordStore.set({
			data: updatedData,
			originalData: updatedOriginalData,
			isSearching,
		});
	} else {
		// If we're in search mode, only update the displayed data
		recordStore.set({
			data: updatedData,
			originalData, // Keep originalData unchanged
			isSearching,
		});
		// Don't update categoriesStore in search mode
	}
};

// Function to handle node expansion
export const toggleNodeExpanded = async (nodeName: string) => {
	const currentData = recordStore.get().data;

	// Helper to find a specific node by name
	const findNode = (nodes: TreeViewNode[]): TreeViewNode | null => {
		for (const node of nodes) {
			if (node.treeId === nodeName) return node;
			if (node.children && node.children.length > 0) {
				const found = findNode(node.children);
				if (found) return found;
			}
		}
		return null;
	};

	const node = findNode(currentData);

	if (node) {
		// If children array is empty and node is being expanded, load children
		if (node.children?.length === 0 && !node.expanded && !node.loading) {
			await loadNodeChildren(nodeName);
		} else {
			// Otherwise just toggle the expanded state
			const updateExpanded = (nodes: TreeViewNode[]): TreeViewNode[] => {
				return nodes.map((n) => {
					if (n.treeId === nodeName) {
						return { ...n, expanded: !n.expanded };
					}
					if (n.children && n.children.length > 0) {
						return { ...n, children: updateExpanded(n.children) };
					}
					return n;
				});
			};

			const updatedData = updateExpanded(currentData);
			recordStore.set({
				data: updatedData,
				originalData: [],
				isSearching: false,
			});
		}
	}
};

// Initialize loading on module import
loadRecords();
