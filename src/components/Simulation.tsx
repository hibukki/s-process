export default function Simulation() {
  const dollarsToAllocate = 1000000; // For all estimators together

  // get all orgs

  // get all estimators

  // get all estimates (points)

  // Initialize:
  // Each fundable org gets 0

  // Take turns going between the estimators
  //   For each org,
  //   If the estimator has an estimate for that org,
  //   Find the estimate for the current amount allocated to that org
  //     How: e.g if the org has 100 alocated, and the estimator has an estimate (a point from the db) for usd=50 and for usd=120, imagine drawing a line between them and find out how much utility that line has.
  //   Then check which org would have the most utility based on this.
  //   Allocate the money to that org. How much: dollarsToAllocate / 1000
  //   Subtract the money from the total
  //   When the money is finished, the simulation ends

  // Print how much each org got

  return (
    <div>
      <h1>Simulation</h1>
    </div>
  );
}
