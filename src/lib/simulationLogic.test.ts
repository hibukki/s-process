import { runAllocation, UtilityGraphPoint, getUtilityAtAmount } from './simulationLogic';
import * as fs from 'fs';
import * as path from 'path';

type TestCase = {
  name: string;
  orgIdToPointsEstimate: {
    [orgId: number]: UtilityGraphPoint[];
  };
};

const testCases: TestCase[] = [
  {
    name: 'one org diminishing utility',
    orgIdToPointsEstimate: {
      1: [
        { usd_amount: 0, marginal_utility: 100, marginal_utility_estimate_id: 1 },
        { usd_amount: 1000000, marginal_utility: 0, marginal_utility_estimate_id: 1 }
      ]
    },
  },
  {
    name: 'two orgs equal diminishing utility',
    orgIdToPointsEstimate: {
      1: [
        { usd_amount: 0, marginal_utility: 100, marginal_utility_estimate_id: 1 },
        { usd_amount: 1000000, marginal_utility: 0, marginal_utility_estimate_id: 1 }
      ],
      2: [
        { usd_amount: 0, marginal_utility: 100, marginal_utility_estimate_id: 2 },
        { usd_amount: 1000000, marginal_utility: 0, marginal_utility_estimate_id: 2 }
      ]
    },
  },
  {
    name: 'org1 has higher utility but saturates at 500k',
    orgIdToPointsEstimate: {
      1: [
        { usd_amount: 0, marginal_utility: 100, marginal_utility_estimate_id: 1 },
        { usd_amount: 500000, marginal_utility: 0, marginal_utility_estimate_id: 1 }
      ],
      2: [
        { usd_amount: 0, marginal_utility: 10, marginal_utility_estimate_id: 2 },
        { usd_amount: 500000, marginal_utility: 0, marginal_utility_estimate_id: 2 }
      ]
    },
  },
];

describe('runAllocation', () => {
  // Create golden_results directory if it doesn't exist
  const goldenDir = path.join(__dirname, 'golden_results');
  if (!fs.existsSync(goldenDir)) {
    fs.mkdirSync(goldenDir);
  }

  test.each(testCases)('$name', ({ name, orgIdToPointsEstimate }) => {
    const estimatorIdTo_OrgIdToPointsEstimate = {
      "estimator1": orgIdToPointsEstimate
    };

    const orgs = Object.keys(orgIdToPointsEstimate).map(orgId => ({ id: Number(orgId), name: `Org ${orgId}` }));

    const result = runAllocation({
      orgs,
      estimatorIdTo_OrgIdToPointsEstimate,
      totalDollars: 1000000,
      numChunks: 4
    });

    // Basic assertions
    expect(result).toBeDefined();
    expect(result.allocations).toBeDefined();
    expect(Object.keys(result.allocations).length).toBe(orgs.length);

    // Save and compare golden results
    const goldenFilePath = path.join(goldenDir, `${name.replace(/\s+/g, '_')}.json`);
    const formattedResult = JSON.stringify(result, null, 2);

    if (!fs.existsSync(goldenFilePath)) {
      // If golden file doesn't exist, create it
      fs.writeFileSync(goldenFilePath, formattedResult);

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
      if (existingGolden !== formattedResult) {
        fs.writeFileSync(goldenFilePath, formattedResult);
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
    expect(() => getUtilityAtAmount(null as any, 100)).toThrow();
    expect(() => getUtilityAtAmount(threePoints, null as any)).toThrow();
  });
}); 