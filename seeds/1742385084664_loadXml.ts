import type { Kysely } from "kysely";
import { readFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";

import type { DB } from "../generated/db";

const xmlData = await readFile("./seeds/structure_released.xml", "utf-8");
// const xmlData = await readFile("./seeds/small.xml", "utf-8");
// const xmlData = await readFile("./seeds/smallest.xml", "utf-8");

type metaData = {
	releaseData: string[];
};

type dataNode = {
	synset: dataNode[];
	":@": {
		wnid: string;
		words: string;
		gloss: string;
	};
};

type XmlData = [
	{
		ImageNetStructure: [metaData, dataNode];
	},
];

const createDataFromXml = (
	xmlObject: XmlData,
): { name: string; size: number }[] => {
	// NOTE: We just assume that the type is correct here.
	//       In a real world scenario, you should check the type of the object and validate it.
	const rootNode = xmlObject[0].ImageNetStructure[1];

	const getRecordData = (
		node: dataNode,
		parentName: string,
		skipRoot?: true,
	) => {
		const parentPrefix = parentName ? `${parentName} > ` : "";
		const name = `${parentPrefix}${node[":@"].words}`;

		let childNodes: { name: string; size: number }[] = [];
		let size = 0;

		// Calculate size - for non-leaf nodes, it's the count of immediate children plus sum of their sizes
		if (node.synset.length > 0) {
			// Start with count of immediate children
			size = node.synset.length;

			// Process all children and add their sizes
			for (const childNode of node.synset) {
				const childRecords = getRecordData(childNode, name);

				// NOTE: Important. When getRecordData() returns results, the first element (index 0)
				// is always the child node itself, and subsequent elements are its descendants.
				// We only need to add the size of the child node (first element) because
				// that size already includes all of its descendants' sizes.
				if (childRecords.length > 0) {
					size += childRecords[0].size;
				}

				// Add all child records to our collection
				childNodes = [...childNodes, ...childRecords];
			}
		}

		// NOTE: Leaf nodes have size 0
		// console.log(
		// 	`Processing node: ${name}, size: ${size}, children: ${node.synset.length}`,
		// );

		const nodeData = {
			name,
			size,
		};

		const shouldSkipRoot = parentName === "" && skipRoot;

		return shouldSkipRoot ? childNodes : [nodeData, ...childNodes];
	};

	// NOTE: We want to skip the root node, so we start from the first child.
	const parsedData = getRecordData(rootNode, "");

	return parsedData;
};

// replace `any` with your database interface.
export async function seed(db: Kysely<DB>): Promise<void> {
	// seed code goes here...
	// note: this function is mandatory. you must implement this function.
	try {
		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "",
			preserveOrder: true,
		});
		const jsonObj = parser.parse(xmlData);
		const parsedDataToRecords = createDataFromXml(jsonObj);

		// TODO: Implement a transaction here, so we can rollback if something goes wrong.
		// NOTE: We have to do this in batches, because the database can only handle a limited number of records at once.
		// Insert records in batches of 1000
		const batchSize = 1000;
		const totalRecords = parsedDataToRecords.length;

		console.log(
			`Inserting ${totalRecords} records in batches of ${batchSize}`,
		);

		for (let i = 0; i < totalRecords; i += batchSize) {
			const batch = parsedDataToRecords.slice(i, i + batchSize);
			await db.insertInto("record").values(batch).execute();
			console.log(
				`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalRecords / batchSize)}`,
			);
		}

		console.log("Seeding completed");
	} catch (error) {
		console.error("Error during seeding:", error);
		throw error;
	}
}
