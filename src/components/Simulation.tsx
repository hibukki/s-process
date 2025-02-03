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

  // Helper function:
  // Given the piecewise linear "utility function" defined by utility graph points,
  // return the estimated total utility at a given allocation amount.
  function getUtilityAtAmount(
    points: UtilityGraphPoint[],
    usd_amount: number
  ): number {
    if (points.length === 0) return 0;
    // Is the amount equal to one of the points?
    const point = points.find((p) => p.usd_amount === usd_amount);
    if (point) return point.utilons;

    // Interpolate between graph points.
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (usd_amount >= p1.usd_amount && usd_amount <= p2.usd_amount) {
        const ratio =
          (usd_amount - p1.usd_amount) / (p2.usd_amount - p1.usd_amount);
        return p1.utilons + ratio * (p2.utilons - p1.utilons);
      }
    }
    // If the amount exceeds the last point, assume the utility has plateaued.
    return points[points.length - 1].utilons;
  }

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
        estimatorUtilityMappings: estimatorUtilityMapping,
        totalDollars: dollarsToAllocate,
        numChunks: chunksToAllocate,
      });

      setOrgs(fetchedOrgs);
      setAllocations(result.allocations);
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
        </div>
      ) : (
        <p>Running simulation...</p>
      )}
    </div>
  );
}
