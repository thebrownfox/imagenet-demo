import type React from "react";
import { useStore } from "@nanostores/react";
import { recordStore, type TreeViewNode } from "../stores/records";
import { Button } from "@/components/ui/button"; // shadcnui Button component

type TreeNodeProps = {
	node: TreeViewNode;
	level?: number;
	onToggle: (node: TreeViewNode) => void;
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0, onToggle }) => {
	return (
		<div style={{ paddingLeft: level * 20 }} className="py-1">
			<div className="flex items-center gap-2">
				{node.children && node.children.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onToggle(node)}
					>
						{node.expanded ? "–" : "+"}
					</Button>
				)}
				<span>
					{node.name} ({node.size})
				</span>
			</div>
			{node.expanded &&
				node.children &&
				node.children.map((child) => (
					<TreeNode
						key={child.name}
						node={{ ...child, treeId: child.name }}
						level={level + 1}
						onToggle={onToggle}
					/>
				))}
		</div>
	);
};

export const TreeView: React.FC = () => {
	const records = useStore(recordStore);

	const handleToggle = (node: TreeViewNode) => {
		const toggleNode = (nodes: TreeViewNode[]): TreeViewNode[] => {
			return nodes.map((cat) => {
				if (cat.name === node.name) {
					return { ...cat, expanded: !cat.expanded };
				}
				if (cat.children) {
					return { ...cat, children: toggleNode(cat.children) };
				}
				return cat;
			});
		};
		recordStore.set({
			data: toggleNode(records.data),
			originalData: records.originalData,
			isSearching: records.isSearching,
		});
	};

	return (
		<div>
			{records.data.map((rec) => (
				<TreeNode key={rec.name} node={rec} onToggle={handleToggle} />
			))}
		</div>
	);
};
