import { Organization, UtilityGraphPoint } from '../simulationLogic';

export const testOrgs: Organization[] = [
  { id: 1, name: "Org 1" },
  { id: 2, name: "Org 2" }
];

export const testUtilityPoints = {
  org1Points: [
    { usd_amount: 0, marginal_utility: 0, marginal_utility_estimate_id: 1 },
    { usd_amount: 500000, marginal_utility: 100, marginal_utility_estimate_id: 1 }
  ] as UtilityGraphPoint[],
  
  org2Points: [
    { usd_amount: 0, marginal_utility: 0, marginal_utility_estimate_id: 2 },
    { usd_amount: 500000, marginal_utility: 50, marginal_utility_estimate_id: 2 }
  ] as UtilityGraphPoint[]
};

export const testEstimatorMappings = {
  "estimator1": {
    1: testUtilityPoints.org1Points,
    2: testUtilityPoints.org2Points
  }
}; 