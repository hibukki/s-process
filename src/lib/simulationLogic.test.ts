import { runAllocation, UtilityGraphPoint, getUtilityAtAmount } from './simulationLogic';
import * as fs from 'fs';
import * as path from 'path';

type TestCaseInput = {
  name: string;
  recommenderId_to_orgIdToPointsEstimate: {
    [recommenderId: string]: {
      [orgId: number]: Array<{
        usd_amount: number;
        marginal_utility: number;
      }>;
    }
  };
};

const testCases: TestCaseInput[] = [
  {
    name: 'one org diminishing utility',
    recommenderId_to_orgIdToPointsEstimate: {
      "estimator1": {
        1: [
          { usd_amount: 0, marginal_utility: 100 },
          { usd_amount: 1000000, marginal_utility: 0 }
        ]
      }
    },
  },
  {
    name: 'two orgs equal diminishing utility',
    recommenderId_to_orgIdToPointsEstimate: {
      "estimator1": {
        1: [
          { usd_amount: 0, marginal_utility: 100 },
          { usd_amount: 1000000, marginal_utility: 0 }
        ],
        2: [
          { usd_amount: 0, marginal_utility: 100 },
          { usd_amount: 1000000, marginal_utility: 0 }
        ]
      }
    },
  },
  {
    name: 'org1 has higher utility but saturates at 500k',
    recommenderId_to_orgIdToPointsEstimate: {
      "estimator1": {
        1: [
          { usd_amount: 0, marginal_utility: 100 },
          { usd_amount: 500000, marginal_utility: 0 }
        ],
        2: [
          { usd_amount: 0, marginal_utility: 10 },
          { usd_amount: 500000, marginal_utility: 0 }
        ]
      }
    },
  },
  {
    name: 'estimator1 likes org1, estimator2 likes org2',
    recommenderId_to_orgIdToPointsEstimate: {
      "estimator1": {
        1: [
          { usd_amount: 0, marginal_utility: 100 },
          { usd_amount: 1_000_000, marginal_utility: 0 }
        ],
        2: [
          { usd_amount: 0, marginal_utility: 10 },
          { usd_amount: 1_000_000, marginal_utility: 0 }
        ]
      },
      "estimator2": {
        1: [
          { usd_amount: 0, marginal_utility: 10 },
          { usd_amount: 1_000_000, marginal_utility: 0 }
        ],
        2: [
          { usd_amount: 0, marginal_utility: 100 },
          { usd_amount: 1_000_000, marginal_utility: 0 }
        ]
      }
    },
  }
];

describe('runAllocation', () => {
  // Create golden_results directory if it doesn't exist
  const goldenDir = path.join(__dirname, 'golden_results');
  if (!fs.existsSync(goldenDir)) {
    fs.mkdirSync(goldenDir);
  }

  test.each(testCases)('$name', ({ name, recommenderId_to_orgIdToPointsEstimate }) => {
    // Add estimate IDs to the points (is this necessary?)
    const estimatorIdTo_OrgIdToPointsEstimate = Object.fromEntries(
      Object.entries(recommenderId_to_orgIdToPointsEstimate).map(([estimatorId, orgIdToPoints]) => [
        estimatorId,
        Object.fromEntries(
          Object.entries(orgIdToPoints).map(([orgId, points], orgIndex) => [
            orgId,
            points.map((point, i) => ({
              ...point,
              marginal_utility_estimate_id: orgIndex * 100 + i + 1
            }))
          ])
        )
      ])
    );

    const orgs = Object.keys(recommenderId_to_orgIdToPointsEstimate["estimator1"]).map(orgId => ({ 
      id: Number(orgId), 
      name: `Org ${orgId}` 
    }));

    const result = runAllocation({
      orgs,
      estimatorIdTo_OrgIdToPointsEstimate,
      configuration: {
        totalDollars: 1000000,
        numChunks: 4
      }
    });

    // Format the log entries to match the previous golden test format
    const formattedResult = {
      allocations: result.allocations,
      log: result.log.map(entry => 
        `Allocated $${entry.allocationAmount.toFixed(2)} to ${entry.orgName} with utility ${entry.utility.toFixed(2)} (Estimator ${entry.estimatorId})`
      )
    };

    // Basic assertions
    expect(formattedResult).toBeDefined();
    expect(formattedResult.allocations).toBeDefined();
    expect(Object.keys(formattedResult.allocations).length).toBe(orgs.length);

    // Save and compare golden results
    const goldenFilePath = path.join(goldenDir, `${name.replace(/\s+/g, '_')}.json`);
    const formattedJson = JSON.stringify(formattedResult, null, 2);

    if (!fs.existsSync(goldenFilePath)) {
      // If golden file doesn't exist, create it
      fs.writeFileSync(goldenFilePath, formattedJson);

      // The test should fail until the golden file is staged/committed.
      throw new Error(
        `Golden test failed for "${name}". Results have changed.\n` +
        `If this change is expected, stage the new golden file at:\n` +
        `${goldenFilePath}`
      );
    } else {

      // If the golden file isn't staged/committed, the test should fail.
      // throw new Error(
      //   `Golden test failed for "${name}". Results have changed.\n` +
      //   `If this change is expected, stage the new golden file at:\n` +
      //   `${goldenFilePath}`
      // );

      // Compare with existing golden file
      const existingGolden = fs.readFileSync(goldenFilePath, 'utf-8');
      if (existingGolden !== formattedJson) {
        fs.writeFileSync(goldenFilePath, formattedJson);
        throw new Error(
          `Golden test failed for "${name}". Results have changed.\n` +
          `If this change is expected, stage the new golden file at:\n` +
          `${goldenFilePath}`
        );
      }
    }
  });
});

describe('getUtilityAtAmount', () => {
  const threePoints: UtilityGraphPoint[] = [
    { usd_amount: 0, marginal_utility: 100, marginal_utility_estimate_id: 1 },
    { usd_amount: 500_000, marginal_utility: 50, marginal_utility_estimate_id: 1 },
    { usd_amount: 1_000_000, marginal_utility: 20, marginal_utility_estimate_id: 1 }
  ];

  test('calculates utility correctly with 3 points', () => {
    // Test exact points
    expect(getUtilityAtAmount(threePoints, 0)).toBe(100);
    expect(getUtilityAtAmount(threePoints, 500_000)).toBe(50);
    expect(getUtilityAtAmount(threePoints, 1_000_000)).toBe(20);

    // Test interpolation between points
    // Half way: At 250000 (halfway between 0 and 500000), should be 75 (halfway between 100 and 50)
    expect(getUtilityAtAmount(threePoints, 250_000)).toBe(75);

    // 20% between the 0 and 500k point:
    expect(getUtilityAtAmount(threePoints, 100_000)).toBe(90);

    // Exactly at each point
    expect(getUtilityAtAmount(threePoints, 0)).toBe(100);
    expect(getUtilityAtAmount(threePoints, 500_000)).toBe(50);
    expect(getUtilityAtAmount(threePoints, 1_000_000)).toBe(20);

    // Different curve: At 750000 (halfway between 500000 and 1000000), should be 35 (halfway between 50 and 20)
    expect(getUtilityAtAmount(threePoints, 750_000)).toBe(35);

    // Beyond last point
    expect(getUtilityAtAmount(threePoints, 1_500_000)).toBe(20);
  });

  test('throws error for invalid inputs', () => {
    expect(() => getUtilityAtAmount([], 100)).toThrow();
    expect(() => getUtilityAtAmount(undefined as unknown as UtilityGraphPoint[], 100)).toThrow();
    expect(() => getUtilityAtAmount(threePoints, undefined as unknown as number)).toThrow();
  });
}); 