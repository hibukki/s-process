import { Tables } from "../../database.types";
import { AllocationLogEntry } from "../lib/simulationLogic";

type Props = {
  orgs: Tables<"fundable_orgs">[];
  log: AllocationLogEntry[];
  userIdToEmail: Record<string, string>;
};

export default function AllocationBreakdown({
  orgs,
  log,
  userIdToEmail,
}: Props) {
  return (
    <div>
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
              {Object.entries(estimatorTotals).map(([estimatorId, amount]) => (
                <li key={`${org.id}-${estimatorId}`}>
                  {userIdToEmail[estimatorId] || `Estimator ${estimatorId}`}: $
                  {amount.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
