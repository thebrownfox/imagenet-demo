import { sql } from "kysely";

interface TreeNode {
	id: string;
	name: string;
	size: number;
	children: Record<string, TreeNode>;
}

interface TreeStructure {
	[key: string]: TreeNode;
}

export interface TreeNodeOutput {
	id: string;
	name: string;
	size: number;
	children: TreeNodeOutput[];
}

export type recordType = {
	id?: number;
	name: string;
	size: number;
};

const getParentSizes = async (parentPaths: string[]) => {
	return await useDb
		.selectFrom("record")
		.select(["name", "size"])
		.where("name", "in", Array.from(parentPaths))
		.execute();
};
/**
 *
 * @param records - Array of records to parse into a tree structure.
 * @param skipParents - If true, skips building the tree structure and returns direct mapping of input records.
 * @returns
 */
const parseRecordsIntoObject = async (
	records: recordType[],
	skipParents = false,
) => {
	// If skipParents is true, return a direct transformation of records
	// TODO: This could be done in a more elegant way, but it's not a priority right now.
	// TODO: Add types for the records and the return value.
	if (skipParents) {
		return records.map((record) => {
			// Extract the last part of the name (after the last >)
			const parts = record.name.split(">").map((s) => s.trim());
			const name = parts[parts.length - 1];

			return {
				id: record.name,
				name: name,
				size: record.size,
				children: [], // Empty children array for direct records
			};
		});
	}

	/**
	 * The tree structure is built like this:
	 *
	 * "ImageNet 2011 Fall Release": {
	 * "id": 1,
	 * "name": "ImageNet 2011 Fall Release",
	 * "size": 0,
	 * "children": {
	 *      "geological formation, formation": {
	 *      "id": 2,
	 *      "name": "geological formation, formation",
	 *      "size": 0,
	 *      "children": {}
	 *     }
	 *    }
	 *   }
	 */
	const tree: TreeStructure = {}; // Using an object as the root for easier lookup
	const parentPaths: Set<string> = new Set(); // Track unique parent paths needing size info
	const recordMap: Map<string, recordType> = new Map(); // Track all records in our input data

	// NOTE: For tree structures with many nodes and lookups, the Map gives much better performance (than .some()) as the number of records increases.
	//       The more lookups you perform, the more the Map approach pays off.

	// Create a map of all record names for quick lookups
	for (const record of records) {
		recordMap.set(record.name, record);
	}

	// NOTE: This adds even the parents that are not in the records. This is because we want to show the whole tree, not just the leaves.
	for (const record of records) {
		const recordNodes = record.name.split(">").map((s) => s.trim());

		let current: TreeStructure = tree;
		let currentPath = "";

		for (const [index, recordNode] of recordNodes.entries()) {
			// Build the full path for this node level
			currentPath =
				index === 0 ? recordNode : `${currentPath} > ${recordNode}`;

			// If this category is not yet a child of the current node, add it.
			if (!current[recordNode]) {
				// Initialize the node with an empty children object.
				current[recordNode] = {
					id: currentPath,
					name: recordNode,
					size: 0,
					children: {},
				};

				// Only add to parentPaths if:
				// 1. It's not a leaf node (not the last in the path)
				// 2. It's not already in our record set (artificially created)
				if (
					index < recordNodes.length - 1 &&
					!recordMap.has(currentPath)
				) {
					parentPaths.add(currentPath);
				}
			}

			// If we're at the last category, set the size.
			if (index === recordNodes.length - 1) {
				current[recordNode].size = record.size;
				current[recordNode].id = record.name;
			}
			// Move to the child node.
			current = current[recordNode].children;
		}
	}

	// Fetch sizes for parent nodes that aren't in our original records
	if (parentPaths.size > 0) {
		const parentSizes = await getParentSizes(Array.from(parentPaths));

		// Update the tree with the parent sizes
		for (const parent of parentSizes) {
			const path = parent.name.split(">").map((s) => s.trim());
			let currentNode = tree;

			// Navigate to the node that needs updating
			for (const segment of path) {
				if (currentNode[segment]) {
					if (currentNode[segment].id === parent.name) {
						currentNode[segment].size = parent.size;
					}
					currentNode = currentNode[segment].children;
				} else {
					break;
				}
			}
		}
	}

	// Convert the tree (which is in object form for easy lookups) to the desired array structure.
	const convert = (nodeMap: Record<string, TreeNode>): TreeNodeOutput[] => {
		return Object.values(nodeMap).map((node) => ({
			id: node.id,
			name: node.name,
			size: node.size,
			children: convert(node.children),
		}));
	};

	return convert(tree);
};

// Function that queries direct children given a parent's name.
const getDirectChildren = async (parentName: string) => {
	console.log("Getting direct children of:", parentName);

	// Find any records where parentName appears followed by exactly one more segment
	// The pattern we're looking for is: anything > parentName > childName
	return await useDb
		.selectFrom("record")
		.select(["id", "name", "size"])
		.where("name", "like", `%${parentName} > %`)
		.where(
			// Make sure there's exactly one more segment after parentName
			// This counts how many '>' appear after parentName in the name string
			sql`(
                length(substr("name", position(${` ${parentName} > `} in "name") + length(${` ${parentName} > `}))) -
                length(replace(substr("name", position(${` ${parentName} > `} in "name") + length(${` ${parentName} > `})), '>', ''))
            )`,
			"=",
			0,
		)
		.execute();
};

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const parentName = query.parentName ? String(query.parentName) : null;
	const searchTerm = query.search ? String(query.search).trim() : null;

	let recordsToReturn = [];
	let skipParents = false;

	// TODO: Consider refactoring this, as it's a bit messy.
	// If a search term is provided, we don't need to check for parentName or parentId.
	if (searchTerm) {
		recordsToReturn = await useDb
			.selectFrom("record")
			.select(["id", "name", "size"])
			.where("name", "like", `%${searchTerm}%`)
			.execute();
	} else if (!parentName) {
		// If no parentName is provided, return root-level nodes.
		// For instance, you might define root-level records as those with no delimiter.
		recordsToReturn = await useDb
			.selectFrom("record")
			.select(["id", "name", "size"])
			.where(
				sql`length("name") - length(replace("name", '>', ''))`,
				"=",
				0,
			)
			.execute();
	} else {
		// Get direct children of the parent node
		recordsToReturn = await getDirectChildren(parentName);
		skipParents = true; // We want to skip parents in this case
	}

	// Use skipParents=true to return direct children without parent nodes
	return await parseRecordsIntoObject(recordsToReturn, skipParents);
});
