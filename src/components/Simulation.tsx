import { useEffect, useState } from "react";
import { Tables } from "../../database.types";
import { supabase } from "../lib/supabase";
import { runAllocation, AllocationLogEntry } from "../lib/simulationLogic";
import { useSession } from "../context/SessionContext";

type Org = Tables<"fundable_orgs">;
type MarginalUtilityEstimate = Tables<"marginal_utility_estimates">;
type UtilityGraphPoint = Tables<"utility_graph_points">;

export default function Simulation() {
  const { session } = useSession();
  const [dollarsToAllocate, setDollarsToAllocate] = useState(1000000);
  const [numTurns, setNumTurns] = useState<number>(100); // Default to 100 turns

  // State to hold final allocations and fetched organizations
  const [allocations, setAllocations] = useState<Record<number, number> | null>(
    null
  );
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [log, setLog] = useState<AllocationLogEntry[]>([]);

  // Add handler for input changes
  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setDollarsToAllocate(value);
    }
  };

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
        numChunks: numTurns,
      });

      setOrgs(fetchedOrgs);
      setAllocations(result.allocations);
      setLog(result.log);
    }
    runSimulation();
  }, [dollarsToAllocate, numTurns]);

  const formatLogEntry = (entry: AllocationLogEntry) => {
    const estimatorDisplay =
      entry.estimatorId === session?.user?.id
        ? session.user.email
        : `Estimator ${entry.estimatorId}`;

    return `Allocated $${entry.allocationAmount.toFixed(2)} to ${
      entry.orgName
    } with utility ${entry.utility.toFixed(2)} (${estimatorDisplay})`;
  };

  return (
    <div>
      <h1>Simulation</h1>
      <div className="mb-4">
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount to Simulate (USD)
        </label>
        <input
          type="number"
          id="amount"
          value={dollarsToAllocate}
          onChange={handleAmountChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          min="0"
          step="1000"
        />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ marginBottom: "10px" }}>
          Number of turns (more turns = slower but more accurate):
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {[10, 100, 1000, 10000].map((turns) => (
            <button
              key={turns}
              onClick={() => setNumTurns(turns)}
              style={{
                padding: "8px 16px",
                backgroundColor: numTurns === turns ? "#4CAF50" : "#f0f0f0",
                color: numTurns === turns ? "white" : "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {turns}
            </button>
          ))}
        </div>
      </div>
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
          <h2>
            Example breakdown: For each org, how much did they get from each
            estimator?
          </h2>
          {orgs.map((org) => {
            // Calculate total per estimator for this org
            const estimatorTotals: Record<string, number> = {};
            log
              .filter((entry) => entry.orgId === org.id)
              .forEach((entry) => {
                estimatorTotals[entry.estimatorId] =
                  (estimatorTotals[entry.estimatorId] || 0) +
                  entry.allocationAmount;
              });

            return (
              <div key={`${org.id}-breakdown`} className="mb-4">
                <h3 className="text-lg font-medium">{org.name}</h3>
                <ul className="ml-4">
                  {Object.entries(estimatorTotals).map(
                    ([estimatorId, amount]) => (
                      <li key={`${org.id}-${estimatorId}`}>
                        {estimatorId === session?.user?.id
                          ? session.user.email
                          : `Estimator ${estimatorId}`}
                        : ${amount.toFixed(2)}
                      </li>
                    )
                  )}
                </ul>
              </div>
            );
          })}
          <h2>Allocation Log:</h2>
          This shows the order in which the allocations were made in the
          simulation
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            {log.map((entry, index) => (
              <div key={index}>{formatLogEntry(entry)}</div>
            ))}
          </div>
        </div>
      ) : (
        <p>Running simulation...</p>
      )}
    </div>
  );
}
