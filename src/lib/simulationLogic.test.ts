import { runAllocation, Organization, UtilityGraphPoint } from './simulationLogic';

describe('runAllocation', () => {
  it('should allocate funds without crashing', () => {
    // Test data
    const orgs: Organization[] = [
      { id: 1, name: "Org 1" },
      { id: 2, name: "Org 2" }
    ];

    // Create utility graph points for each org
    const org1Points: UtilityGraphPoint[] = [
      { usd_amount: 0, utilons: 0, marginal_utility_estimate_id: 1 },
      { usd_amount: 500000, utilons: 100, marginal_utility_estimate_id: 1 }
    ];

    const org2Points: UtilityGraphPoint[] = [
      { usd_amount: 0, utilons: 0, marginal_utility_estimate_id: 2 },
      { usd_amount: 500000, utilons: 50, marginal_utility_estimate_id: 2 }
    ];

    // Create estimator mappings
    const estimatorUtilityMappings = {
      "estimator1": {
        1: org1Points,
        2: org2Points
      }
    };

    const result = runAllocation({
      orgs,
      estimatorUtilityMappings,
      totalDollars: 1000000,
      numChunks: 10
    });

    // Basic assertions
    expect(result).toBeDefined();
    expect(result.allocations).toBeDefined();
    expect(Object.keys(result.allocations).length).toBe(2);
    
    // The total allocated should equal the total dollars
    const totalAllocated = Object.values(result.allocations)
      .reduce((sum, amount) => sum + amount, 0);
    expect(totalAllocated).toBe(1000000);

    // Org 1 should get more money since it has higher utility
    expect(result.allocations[1]).toBeGreaterThan(result.allocations[2]);
  });
}); 