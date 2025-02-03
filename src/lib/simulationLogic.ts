export type UtilityGraphPoint = {
  usd_amount: number;
  marginal_utility: number;
  marginal_utility_estimate_id: number;
};

export type Organization = {
  id: number;
  name: string;
};

export type SimulationResult = {
  allocations: Record<number, number>;  // org_id -> allocated amount
  log: string[];  // allocation history
};

// Represents all utility estimates from one estimator
export type OrgIdToPointsEstimate = Record<number, UtilityGraphPoint[]>; // org_id -> points

const assertSortedPoints = (points: UtilityGraphPoint[]) => {
  if (!points || points.length === 0) {
    throw new Error("Points array must not be empty or null");
  }

  // Check each point against the next point, but stop at length-1 to avoid undefined access
  for (let i = 0; i < points.length - 1; i++) {
    const currentPoint = points[i];
    const nextPoint = points[i + 1];
    
    if (currentPoint.usd_amount >= nextPoint.usd_amount) {
      throw new Error(
        `Points must be sorted by ascending usd_amount. Found ${currentPoint.usd_amount} followed by ${nextPoint.usd_amount}`
      );
    }
  }
}

const sortPoints = (points: UtilityGraphPoint[]) => {
  // return points;
  return points.sort((a, b) => a.usd_amount - b.usd_amount);
}


// Helper function from original code
export function getUtilityAtAmount(
  pointsEstimateForOneOrg: UtilityGraphPoint[],
  usd_amount: number
): number {
  // Validate inputs
  if (!pointsEstimateForOneOrg) {
    throw new Error("sortedPoints must not be null");
  }
  if (typeof usd_amount !== 'number') {
    throw new Error("usd_amount must be a number");
  }
  const sortedPoints = sortPoints(pointsEstimateForOneOrg);
  assertSortedPoints(sortedPoints);

  if (sortedPoints.length === 0) return 0;
  const point = sortedPoints.find((p) => p.usd_amount === usd_amount);
  if (point) return point.marginal_utility;

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];
    if (usd_amount >= p1.usd_amount && usd_amount <= p2.usd_amount) {
      const ratio =
        (usd_amount - p1.usd_amount) / (p2.usd_amount - p1.usd_amount);
      return p1.marginal_utility + ratio * (p2.marginal_utility - p1.marginal_utility);
    }
  }
  return sortedPoints[sortedPoints.length - 1].marginal_utility;
}

export function runAllocation(params: {
  orgs: Organization[];
  estimatorIdTo_OrgIdToPointsEstimate: Record<string, OrgIdToPointsEstimate>; // estimator_id -> mapping
  totalDollars: number;
  numChunks: number;
}): SimulationResult {
  const { orgs, estimatorIdTo_OrgIdToPointsEstimate: estimatorUtilityMappings, totalDollars, numChunks } = params;

  let fundsRemaining = totalDollars;
  const chunk = totalDollars / numChunks;
  const orgAllocations: Record<number, number> = {};
  orgs.forEach((org) => {
    orgAllocations[org.id] = 0;
  });

  const estimatorIds = Object.keys(estimatorUtilityMappings);

  const log: string[] = [];
  
  let iteration = 0;
  while (fundsRemaining > 0 && iteration < 10000) {
    for (let i = 0; i < estimatorIds.length && fundsRemaining > 0; i++) {
      const estId = estimatorIds[i];
      let bestIncrement = -Infinity;
      let bestOrgId: number | null = null;

      const orgIdToGraphPoints = estimatorUtilityMappings[estId];
      for (const orgIdStr in orgIdToGraphPoints) {
        const orgId = Number(orgIdStr);
        const estimatePoints = orgIdToGraphPoints[orgId]; // For this estimator, for this org

        const currentAllocation = orgAllocations[orgId];
        const incrementalUtility = getUtilityAtAmount(estimatePoints, currentAllocation);

        if (incrementalUtility > bestIncrement) {
          bestIncrement = incrementalUtility;
          bestOrgId = orgId;
        }
      }

      if (bestOrgId !== null) {
        const allocationAmount = Math.min(chunk, fundsRemaining);
        orgAllocations[bestOrgId] += allocationAmount;
        fundsRemaining -= allocationAmount;
        
        // Add log entry for this allocation
        const org = orgs.find(o => o.id === bestOrgId);
        log.push(`Allocated $${allocationAmount.toFixed(2)} to ${org?.name || `Org ${bestOrgId}`} with utility ${bestIncrement.toFixed(2)} (Estimator ${estId})`);
      }
    }
    iteration++;
  }

  return { 
    allocations: orgAllocations,
    log 
  };
} 