import { Tables } from "../../database.types";
import { AllocationLogEntry } from "../lib/simulationLogic";
import { ResponsiveSankey } from "@nivo/sankey";

type Props = {
  orgs: Tables<"fundable_orgs">[];
  log: AllocationLogEntry[];
  userIdToEmail: Record<string, string>;
};

type NodeData = {
  id: string;
  nodeColor: string;
  value: number; // Adding value to help with sorting and sizing
};

type LinkData = {
  source: string;
  target: string;
  value: number;
};

export default function AllocationBreakdown({
  orgs,
  log,
  userIdToEmail,
}: Props) {
  // Process data for Sankey diagram
  const nodes: NodeData[] = [];
  const links: LinkData[] = [];

  // Calculate total values for each estimator and org
  const estimatorTotals: Record<string, number> = {};
  const orgTotals: Record<string, number> = {};

  log.forEach((entry) => {
    const estimatorId =
      userIdToEmail[entry.estimatorId] || `Estimator ${entry.estimatorId}`;
    estimatorTotals[estimatorId] =
      (estimatorTotals[estimatorId] || 0) + entry.allocationAmount;
    orgTotals[entry.orgId] =
      (orgTotals[entry.orgId] || 0) + entry.allocationAmount;
  });

  // Add estimator nodes, sorted by total value
  const estimatorIds = Array.from(
    new Set(log.map((entry) => entry.estimatorId))
  );
  estimatorIds
    .sort((a, b) => {
      const aId = userIdToEmail[a] || `Estimator ${a}`;
      const bId = userIdToEmail[b] || `Estimator ${b}`;
      return (estimatorTotals[bId] || 0) - (estimatorTotals[aId] || 0);
    })
    .forEach((id) => {
      const nodeId = userIdToEmail[id] || `Estimator ${id}`;
      nodes.push({
        id: nodeId,
        nodeColor: "#88c0d0",
        value: estimatorTotals[nodeId] || 1000, // Minimum value to ensure visibility
      });
    });

  // Add org nodes, sorted by total value
  orgs
    .sort((a, b) => (orgTotals[b.id] || 0) - (orgTotals[a.id] || 0))
    .forEach((org) => {
      nodes.push({
        id: org.name,
        nodeColor: "#a3be8c",
        value: orgTotals[org.id] || 1000, // Minimum value to ensure visibility
      });
    });

  // Calculate links (flows)
  estimatorIds.forEach((estimatorId) => {
    orgs.forEach((org) => {
      const amount = log
        .filter(
          (entry) => entry.estimatorId === estimatorId && entry.orgId === org.id
        )
        .reduce((sum, entry) => sum + entry.allocationAmount, 0);

      if (amount > 0) {
        links.push({
          source: userIdToEmail[estimatorId] || `Estimator ${estimatorId}`,
          target: org.name,
          value: amount,
        });
      }
    });
  });

  // Calculate total allocation
  const totalAllocation = links.reduce((sum, link) => sum + link.value, 0);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Allocation Flow: From Estimators to Organizations
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Total Allocated: ${totalAllocation.toLocaleString()}
      </p>
      <div style={{ height: "600px" }}>
        <ResponsiveSankey<NodeData, LinkData>
          data={{
            nodes,
            links,
          }}
          margin={{ top: 40, right: 220, bottom: 40, left: 220 }}
          align="justify"
          colors={{ scheme: "category10" }}
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={18}
          nodeSpacing={40}
          nodeBorderWidth={0}
          nodeBorderColor={{
            from: "color",
            modifiers: [["darker", 0.8]],
          }}
          linkOpacity={0.5}
          linkHoverOthersOpacity={0.1}
          linkContract={3}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="vertical"
          labelPadding={20}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1]],
          }}
          nodeTooltip={({ node }) => (
            <div
              style={{
                background: "white",
                padding: "9px 12px",
                border: "1px solid #ccc",
              }}
            >
              <strong>{node.id}</strong>
              {node.value > 1000 && (
                <div>Total: ${(node.value || 0).toLocaleString()}</div>
              )}
            </div>
          )}
          linkTooltip={({ link }) => (
            <div
              style={{
                background: "white",
                padding: "9px 12px",
                border: "1px solid #ccc",
              }}
            >
              <strong>${link.value.toLocaleString()}</strong>
            </div>
          )}
        />
      </div>
    </div>
  );
}
