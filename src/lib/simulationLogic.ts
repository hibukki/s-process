export type UtilityGraphPoint = {
  usd_amount: number;
  utilons: number;
  marginal_utility_estimate_id: number;
};

export type Organization = {
  id: number;
  name: string;
};

export type SimulationResult = {
  allocations: Record<number, number>;  // org_id -> allocated amount
};

// Represents all utility estimates from one estimator
export type EstimatorUtilityMapping = Record<number, UtilityGraphPoint[]>; // org_id -> points

export function runAllocation(params: {
  orgs: Organization[];
  estimatorUtilityMappings: Record<string, EstimatorUtilityMapping>; // estimator_id -> mapping
  totalDollars: number;
  numChunks: number;
}): SimulationResult {
  const { orgs, estimatorUtilityMappings, totalDollars, numChunks } = params;
  
  // Helper function from original code
  function getUtilityAtAmount(
    points: UtilityGraphPoint[],
    usd_amount: number
  ): number {
    if (points.length === 0) return 0;
    const point = points.find((p) => p.usd_amount === usd_amount);
    if (point) return point.utilons;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (usd_amount >= p1.usd_amount && usd_amount <= p2.usd_amount) {
        const ratio =
          (usd_amount - p1.usd_amount) / (p2.usd_amount - p1.usd_amount);
        return p1.utilons + ratio * (p2.utilons - p1.utilons);
      }
    }
    return points[points.length - 1].utilons;
  }

  let fundsRemaining = totalDollars;
  const chunk = totalDollars / numChunks;
  const orgAllocations: Record<number, number> = {};
  orgs.forEach((org) => {
    orgAllocations[org.id] = 0;
  });

  const estimatorIds = Object.keys(estimatorUtilityMappings);

  let iteration = 0;
  while (fundsRemaining > 0 && iteration < 10000) {
    for (let i = 0; i < estimatorIds.length && fundsRemaining > 0; i++) {
      const estId = estimatorIds[i];
      let bestIncrement = -Infinity;
      let bestOrgId: number | null = null;

      const orgIdToGraphPoints = estimatorUtilityMappings[estId];
      for (const orgIdStr in orgIdToGraphPoints) {
        const orgId = Number(orgIdStr);
        const points = orgIdToGraphPoints[orgId];
        const currentAllocation = orgAllocations[orgId];
        const incrementalUtility = getUtilityAtAmount(points, currentAllocation);

        if (incrementalUtility > bestIncrement) {
          bestIncrement = incrementalUtility;
          bestOrgId = orgId;
        }
      }

      if (bestOrgId !== null) {
        const allocationAmount = Math.min(chunk, fundsRemaining);
        orgAllocations[bestOrgId] += allocationAmount;
        fundsRemaining -= allocationAmount;
      }
    }
    iteration++;
  }

  return { allocations: orgAllocations };
} 