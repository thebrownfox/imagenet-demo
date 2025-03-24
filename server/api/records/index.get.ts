import { sql } from "kysely";

interface TreeNode {
	id?: number;
	name: string;
	size: number;
	children: Record<string, TreeNode>;
}

interface TreeStructure {
	[key: string]: TreeNode;
}

export interface TreeNodeOutput {
	id?: number;
	name: string;
	size: number;
	children: TreeNodeOutput[];
}

export type recordType = {
	id?: number;
	name: string;
	size: number;
};

/**
 *
 * @param records - Array of records to parse into a tree structure.
 * @param records.id - The ID of the record.
 * @param records.name - The name of the record, which may contain a hierarchy represented by ">".
 * @param records.size - The size of the record.
 * @param skipParents - If true, skips building the tree structure and returns direct mapping of input records.
 * @returns
 */
const parseRecordsIntoObject = (records: recordType[], skipParents = false) => {
	// If skipParents is true, return a direct transformation of records
	// TODO: This could be done in a more elegant way, but it's not a priority right now.
	// TODO: Add types for the records and the return value.
	if (skipParents) {
		return records.map((record) => {
			// Extract the last part of the name (after the last >)
			const parts = record.name.split(">").map((s) => s.trim());
			const name = parts[parts.length - 1];

			return {
				id: record.id,
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

	// NOTE: This adds even the parents that are not in the records. This is because we want to show the whole tree, not just the leaves.
	// TODO: Fix IDs and sizes of the parents.
	for (const record of records) {
		const recordNodes = record.name.split(">").map((s) => s.trim());

		let current: TreeStructure = tree;

		for (const [index, recordNode] of recordNodes.entries()) {
			// If this category is not yet a child of the current node, add it.
			if (!current[recordNode]) {
				// Initialize the node with an empty children object.
				current[recordNode] = {
					id: 0,
					name: recordNode,
					size: 0,
					children: {},
				};
			}

			// If we're at the last category, set the size.
			if (index === recordNodes.length - 1) {
				current[recordNode].size = record.size;
				current[recordNode].id = record.id;
			}
			// Move to the child node.
			current = current[recordNode].children;
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
	const parentId = query.parentId ? Number(query.parentId) : null;
	const searchTerm = query.search ? String(query.search).trim() : null;

	let nameToLookup = parentName;
	let recordsToReturn = [];

	// TODO: Consider refactoring this, as it's a bit messy.
	// If a search term is provided, we don't need to check for parentName or parentId.
	if (searchTerm) {
		recordsToReturn = await useDb
			.selectFrom("record")
			.select(["id", "name", "size"])
			.where("name", "like", `%${searchTerm}%`)
			.execute();
	} else {
		// NOTE: We support ID because it's shorter and cleaner in the URL. But it might be broken as sometimes the ID is 0.
		if (parentId) {
			// If parentId is provided, get the record with that ID and use its name.
			const parent = await useDb
				.selectFrom("record")
				.select(["name"])
				.where("id", "=", parentId)
				.executeTakeFirst();
			// We might not want to throw an error here, but rather return an empty array.
			if (!parent) {
				throw createError({
					statusCode: 404,
					statusMessage: "Parent record not found",
				});
			}
			nameToLookup = parent.name;
		}

		if (!nameToLookup) {
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
			recordsToReturn = await getDirectChildren(nameToLookup);

			// Use skipParents=true to return direct children without parent nodes
			return parseRecordsIntoObject(recordsToReturn, true);
		}
	}

	return parseRecordsIntoObject(recordsToReturn);
});
