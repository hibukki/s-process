import { useEffect, useState } from "react";
import { Tables } from "../../database.types";
import { supabase } from "../lib/supabase";
import { runAllocation } from "../lib/simulationLogic";

type Org = Tables<"fundable_orgs">;
type MarginalUtilityEstimate = Tables<"marginal_utility_estimates">;
type UtilityGraphPoint = Tables<"utility_graph_points">;

export default function Simulation() {
  const dollarsToAllocate = 1000000; // For all estimators together
  const chunksToAllocate = 10;

  // State to hold final allocations and fetched organizations
  const [allocations, setAllocations] = useState<Record<number, number> | null>(
    null
  );
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    async function runSimulation() {
      // Get orgs from Supabase.
      const { data: orgsData, error: orgError } = await supabase
        .from("fundable_orgs")
        .select("*");
      if (orgError || !orgsData) {
        console.error("Error fetching organizations:", orgError);
        return;
      }
      const fetchedOrgs = orgsData as Org[];
      setOrgs(fetchedOrgs);

      // Get marginal utility estimates.
      const { data: estimatesData, error: estimatesError } = await supabase
        .from("marginal_utility_estimates")
        .select("*");
      if (estimatesError || !estimatesData) {
        console.error("Error fetching estimates:", estimatesError);
        return;
      }
      const utilityEstimates = estimatesData as MarginalUtilityEstimate[];

      // Get utility graph points.
      const { data: graphPointsData, error: graphPointsError } = await supabase
        .from("utility_graph_points")
        .select("*");
      if (graphPointsError || !graphPointsData) {
        console.error("Error fetching utility graph points:", graphPointsError);
        return;
      }
      const utilityGraphPoints = graphPointsData as UtilityGraphPoint[];

      console.log("Utility graph points:", utilityGraphPoints);

      // Build a mapping: estimator_id -> { org_id -> UtilityGraphPoint[] }
      const estimatorUtilityMapping: Record<
        string,
        Record<number, UtilityGraphPoint[]>
      > = {};

      utilityEstimates.forEach((estimate) => {
        const { estimator_id, org_id, id } = estimate;
        if (!estimatorUtilityMapping[estimator_id]) {
          estimatorUtilityMapping[estimator_id] = {};
        }
        const points = utilityGraphPoints.filter(
          (p) => p.marginal_utility_estimate_id === id
        );
        points.sort((a, b) => a.usd_amount - b.usd_amount);
        estimatorUtilityMapping[estimator_id][org_id] = points;
      });

      console.log("Estimator utility mapping:", estimatorUtilityMapping);

      // Run the simulation using the extracted logic
      const result = runAllocation({
        orgs: fetchedOrgs,
        estimatorIdTo_OrgIdToPointsEstimate: estimatorUtilityMapping,
        totalDollars: dollarsToAllocate,
        numChunks: chunksToAllocate,
      });

      setOrgs(fetchedOrgs);
      setAllocations(result.allocations);
      setLog(result.log);
    }
    runSimulation();
  }, [dollarsToAllocate]);

  return (
    <div>
      <h1>Simulation</h1>
      {orgs.length > 0 && allocations ? (
        <div>
          <h2>Final Allocations:</h2>
          <ul>
            {orgs.map((org) => (
              <li key={org.id}>
                {org.name}: ${allocations[org.id].toFixed(2)}
              </li>
            ))}
          </ul>
          <h2>Allocation Log:</h2>
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            {log.map((entry, index) => (
              <div key={index}>{entry}</div>
            ))}
          </div>
        </div>
      ) : (
        <p>Running simulation...</p>
      )}
    </div>
  );
}
