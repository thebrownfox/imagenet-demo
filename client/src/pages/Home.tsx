import { Search } from "../components/Search";
import { TreeView, type TreeDataItem } from "../components/ui/tree-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { recordStore, toggleNodeExpanded } from "../stores/records";
import { RefreshCw } from "lucide-react";

const Home: React.FC = () => {
	const { data: records } = useStore(recordStore);
	const isLoading = records.length === 0;

	// Transform records to use name as id for TreeView component
	const transformedRecords = useMemo(() => {
		if (!records.length) return [];

		const transformNode = (node: (typeof records)[0]): TreeDataItem => {
			return {
				id: node.treeId,
				name: node.name,
				...(node.size && { size: node.size }),
				...(node.loading && {
					icon: RefreshCw,
					draggable: false,
				}),
				...(node.children && {
					children: node.children.map(transformNode),
				}),
			};
		};

		return records.map(transformNode);
	}, [records]);

	// Handle node expansion in the TreeView
	const handleNodeExpand = (item: TreeDataItem | undefined) => {
		// Early return if item is undefined
		if (!item) return;
		// The node name is used as the ID
		toggleNodeExpanded(item.id);
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Category Tree</h1>
			<Search />
			{isLoading && (
				<div className="flex flex-col gap-2">
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
				</div>
			)}
			{!isLoading && !transformedRecords?.length && (
				<div className="text-center">
					<p>No records found.</p>
				</div>
			)}
			{!isLoading && transformedRecords.length > 0 && (
				<TreeView
					data={transformedRecords}
					onSelectChange={handleNodeExpand}
				/>
			)}
		</div>
	);
};

export default Home;
