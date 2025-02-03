import { runAllocation, Organization, UtilityGraphPoint } from './simulationLogic';
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
        { usd_amount: 0, utilons: 100, marginal_utility_estimate_id: 1 },
        { usd_amount: 1000000, utilons: 0, marginal_utility_estimate_id: 1 }
      ]
    },
  },
  {
    name: 'two orgs equal diminishing utility',
    orgIdToPointsEstimate: {
      1: [
        { usd_amount: 0, utilons: 100, marginal_utility_estimate_id: 1 },
        { usd_amount: 1000000, utilons: 0, marginal_utility_estimate_id: 1 }
      ],
      2: [
        { usd_amount: 0, utilons: 100, marginal_utility_estimate_id: 2 },
        { usd_amount: 1000000, utilons: 0, marginal_utility_estimate_id: 2 }
      ]
    },
  },
  {
    name: 'org1 has higher utility but saturates at 500k',
    orgIdToPointsEstimate: {
      1: [
        { usd_amount: 0, utilons: 100, marginal_utility_estimate_id: 1 },
        { usd_amount: 500000, utilons: 0, marginal_utility_estimate_id: 1 }
      ],
      2: [
        { usd_amount: 0, utilons: 10, marginal_utility_estimate_id: 2 },
        { usd_amount: 500000, utilons: 0, marginal_utility_estimate_id: 2 }
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