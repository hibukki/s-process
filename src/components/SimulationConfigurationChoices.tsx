import { useState, useEffect } from "react";
import { SimulationConfiguration } from "../lib/simulationLogic";

interface SimulationConfigurationChoicesProps {
  onConfigurationChange: (configuration: SimulationConfiguration) => void;
}

const DEFAULT_CONFIGURATION: SimulationConfiguration = {
  totalDollars: 1000000,
  numChunks: 100,
};

export default function SimulationConfigurationChoices({
  onConfigurationChange,
}: SimulationConfigurationChoicesProps) {
  const [dollarsToAllocate, setDollarsToAllocate] = useState(
    DEFAULT_CONFIGURATION.totalDollars
  );
  const [numTurns, setNumTurns] = useState<number>(
    DEFAULT_CONFIGURATION.numChunks
  );

  // Set initial configuration when component mounts
  useEffect(() => {
    onConfigurationChange(DEFAULT_CONFIGURATION);
  }, [onConfigurationChange]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setDollarsToAllocate(value);
      onConfigurationChange({
        totalDollars: value,
        numChunks: numTurns,
      });
    }
  };

  const handleTurnsChange = (turns: number) => {
    setNumTurns(turns);
    onConfigurationChange({
      totalDollars: dollarsToAllocate,
      numChunks: turns,
    });
  };

  return (
    <div>
      <div className="mb-4">
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount to Simulate (USD)
        </label>
        <input
          type="number"
          id="amount"
          value={dollarsToAllocate}
          onChange={handleAmountChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          min="0"
          step="1000"
        />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ marginBottom: "10px" }}>
          Number of turns (more turns = slower but more accurate):
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {[10, 100, 1000, 10000].map((turns) => (
            <button
              key={turns}
              onClick={() => handleTurnsChange(turns)}
              style={{
                padding: "8px 16px",
                backgroundColor: numTurns === turns ? "#4CAF50" : "#f0f0f0",
                color: numTurns === turns ? "white" : "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {turns}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
