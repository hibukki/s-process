import { runAllocation, Organization, UtilityGraphPoint } from './simulationLogic';

type TestCase = {
  name: string;
  orgs: Organization[];
  utilityPoints: {
    [orgId: number]: UtilityGraphPoint[];
  };
  expectedResult: {
    totalAllocated: number;
    hasHigherAllocation?: [number, number]; // [orgId1, orgId2] where orgId1 should get more than orgId2
  };
};

const testCases: TestCase[] = [
  {
    name: 'basic case - two orgs with different utilities',
    orgs: [
      { id: 1, name: "Org 1" },
      { id: 2, name: "Org 2" }
    ],
    utilityPoints: {
      1: [
        { usd_amount: 0, utilons: 0, marginal_utility_estimate_id: 1 },
        { usd_amount: 500000, utilons: 100, marginal_utility_estimate_id: 1 }
      ],
      2: [
        { usd_amount: 0, utilons: 0, marginal_utility_estimate_id: 2 },
        { usd_amount: 500000, utilons: 50, marginal_utility_estimate_id: 2 }
      ]
    },
    expectedResult: {
      totalAllocated: 1000000,
      hasHigherAllocation: [1, 2] // Org 1 should get more than Org 2
    }
  },
  {
    name: 'equal utility case',
    orgs: [
      { id: 3, name: "Org 3" },
      { id: 4, name: "Org 4" }
    ],
    utilityPoints: {
      3: [
        { usd_amount: 0, utilons: 0, marginal_utility_estimate_id: 3 },
        { usd_amount: 500000, utilons: 100, marginal_utility_estimate_id: 3 }
      ],
      4: [
        { usd_amount: 0, utilons: 0, marginal_utility_estimate_id: 4 },
        { usd_amount: 500000, utilons: 100, marginal_utility_estimate_id: 4 }
      ]
    },
    expectedResult: {
      totalAllocated: 1000000
      // No hasHigherAllocation check since they should be roughly equal
    }
  }
];

describe('runAllocation', () => {
  test.each(testCases)('$name', ({ orgs, utilityPoints, expectedResult }) => {
    const estimatorUtilityMappings = {
      "estimator1": utilityPoints
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
    expect(Object.keys(result.allocations).length).toBe(orgs.length);
    
    // Check total allocation
    const totalAllocated = Object.values(result.allocations)
      .reduce((sum, amount) => sum + amount, 0);
    expect(totalAllocated).toBe(expectedResult.totalAllocated);

    // Check relative allocation if specified
    if (expectedResult.hasHigherAllocation) {
      const [higherOrgId, lowerOrgId] = expectedResult.hasHigherAllocation;
      expect(result.allocations[higherOrgId]).toBeGreaterThan(result.allocations[lowerOrgId]);
    }
  });
}); 