import React, { useState, useRef, useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";

export interface UsdUtilonPoint {
  id: number;
  usd_amount: number;
  marginal_utility: number;
}

interface XYPoint {
  id: number;
  x: number;
  y: number;
}

interface MarginalUtilityEditorProps {
  initialPoints: UsdUtilonPoint[];
  onSave?: (points: UsdUtilonPoint[]) => void;
  mini?: boolean;
}

const MarginalUtilityEditor = ({
  initialPoints,
  onSave,
  mini = false,
}: MarginalUtilityEditorProps) => {
  // SVG viewport constants
  const width = mini ? 200 : 400;
  const height = mini ? 120 : 400;
  const padding = mini ? 20 : 40;

  // Add text padding for labels
  const textPadding = mini ? 5 : 10;

  // Scale values
  const maxDollars = 10000000; // $10M
  const maxMarginalUtility = 100;

  const defaultPoints: UsdUtilonPoint[] = [
    { id: 1, usd_amount: 0, marginal_utility: maxMarginalUtility },
    {
      id: 2,
      usd_amount: maxDollars / 2,
      marginal_utility: maxMarginalUtility / 2,
    },
    { id: 3, usd_amount: maxDollars, marginal_utility: 0 },
  ];

  // Convert from USD/Utilon coordinates to SVG coordinates
  const xyPointFromUsdUtilonPoint = (point: UsdUtilonPoint): XYPoint => {
    return {
      id: point.id,
      x: (point.usd_amount / maxDollars) * (width - 2 * padding) + padding,
      y:
        height -
        ((point.marginal_utility / maxMarginalUtility) *
          (height - 2 * padding) +
          padding),
    };
  };

  // Convert from SVG coordinates to USD/Utilon coordinates
  const usdUtilonPointFromXY = (point: XYPoint): UsdUtilonPoint => {
    return {
      id: point.id,
      usd_amount: ((point.x - padding) / (width - 2 * padding)) * maxDollars,
      marginal_utility:
        ((height - point.y - padding) / (height - 2 * padding)) *
        maxMarginalUtility,
    };
  };

  const [usdUtilonPoints, setUsdUtilonPoints] = useState<UsdUtilonPoint[]>(
    initialPoints?.length ? initialPoints : defaultPoints
  );
  const [nextId, setNextId] = useState(4);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { isDarkMode } = useContext(ThemeContext);
  const axisColor = isDarkMode ? "#9ca3af" : "black"; // gray-400 in dark mode
  const textColor = isDarkMode ? "#d1d5db" : "black"; // gray-300 in dark mode
  const lineColor = isDarkMode ? "#60a5fa" : "blue"; // blue-400 in dark mode

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Reset success message when points match initialPoints
  useEffect(() => {
    const pointsMatch = usdUtilonPoints.every(
      (point, index) =>
        point.usd_amount === initialPoints[index]?.usd_amount &&
        point.marginal_utility === initialPoints[index]?.marginal_utility
    );
    if (pointsMatch) {
      setShowSaveSuccess(false);
    }
  }, [usdUtilonPoints, initialPoints]);

  const getSVGCoords = (e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };

    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    return point.matrixTransform(CTM.inverse());
  };

  const handleDrag = (e: MouseEvent, pointId: number) => {
    const coords = getSVGCoords(e);

    // Find if this is the leftmost point
    const isLeftmostPoint = usdUtilonPoints.every(
      (p) => p.id === pointId || xyPointFromUsdUtilonPoint(p).x > padding
    );

    // If leftmost point, keep x at padding (x=0 in graph coordinates)
    const newX = isLeftmostPoint
      ? padding
      : Math.max(padding, Math.min(width - padding, coords.x));

    const newY = Math.max(padding, Math.min(height - padding, coords.y));

    setUsdUtilonPoints(
      usdUtilonPoints.map((point) =>
        point.id === pointId
          ? usdUtilonPointFromXY({ id: pointId, x: newX, y: newY })
          : point
      )
    );
  };

  const addPoint = () => {
    const newXYPoint = {
      id: nextId,
      x: Math.random() * (width - 2 * padding) + padding,
      y: Math.random() * (height - 2 * padding) + padding,
    };
    const newUsdUtilonPoint = usdUtilonPointFromXY(newXYPoint);
    setUsdUtilonPoints([...usdUtilonPoints, newUsdUtilonPoint]);
    setNextId(nextId + 1);
  };

  const deleteSelectedPoint = () => {
    if (selectedPoint !== null && usdUtilonPoints.length > 2) {
      setUsdUtilonPoints(
        usdUtilonPoints.filter((point) => point.id !== selectedPoint)
      );
      setSelectedPoint(null);
    }
  };

  const sortedPoints = [...usdUtilonPoints]
    .map(xyPointFromUsdUtilonPoint)
    .sort((a, b) => a.x - b.x);

  const handleSave = () => {
    onSave?.(usdUtilonPoints);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  return (
    <div className={`${mini ? "inline-block" : "w-full max-w-lg mx-auto p-4"}`}>
      {!mini && (
        <h2 className="text-xl font-bold text-center mb-4">
          Marginal Utility Editor
        </h2>
      )}
      {!mini && (
        <div className="mb-4 space-x-2">
          <button
            onClick={addPoint}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Point
          </button>
          <button
            onClick={deleteSelectedPoint}
            disabled={selectedPoint === null || usdUtilonPoints.length <= 2}
            className={`font-bold py-2 px-4 rounded ${
              selectedPoint !== null && usdUtilonPoints.length > 2
                ? "bg-red-500 hover:bg-red-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Delete Selected Point
          </button>
        </div>
      )}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg ${
          mini ? "shadow-sm" : ""
        }`}
      >
        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={axisColor}
          strokeWidth={mini ? "1" : "2"}
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke={axisColor}
          strokeWidth={mini ? "1" : "2"}
        />

        {!mini && (
          <>
            {/* X-axis label and values */}
            <text
              x={width / 2}
              y={height - textPadding}
              textAnchor="middle"
              className="text-sm"
              fill={textColor}
            >
              Dollars
            </text>
            <text
              x={padding}
              y={height - textPadding}
              textAnchor="middle"
              className="text-sm"
              fill={textColor}
            >
              0
            </text>
            <text
              x={width - padding}
              y={height - textPadding}
              textAnchor="middle"
              className="text-sm"
              fill={textColor}
            >
              $10M
            </text>

            {/* Y-axis label and values */}
            <text
              x={textPadding}
              y={height / 2}
              textAnchor="middle"
              transform={`rotate(-90, ${textPadding}, ${height / 2})`}
              className="text-sm"
              fill={textColor}
            >
              Marginal Utility
            </text>
            <text
              x={padding - textPadding}
              y={height - padding}
              textAnchor="end"
              className="text-sm"
              fill={textColor}
            >
              0
            </text>
            <text
              x={padding - textPadding}
              y={padding}
              textAnchor="end"
              className="text-sm"
              fill={textColor}
            >
              100
            </text>
          </>
        )}

        {/* Lines connecting points */}
        <path
          d={`M ${sortedPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`}
          stroke={lineColor}
          strokeWidth={mini ? "2" : "2"}
          fill="none"
        />

        {/* Draggable points */}
        {!mini &&
          usdUtilonPoints.map((point) => {
            const xyPoint = xyPointFromUsdUtilonPoint(point);
            return (
              <circle
                key={point.id}
                cx={xyPoint.x}
                cy={xyPoint.y}
                r="6"
                fill={selectedPoint === point.id ? "purple" : "red"}
                cursor="move"
                onMouseDown={() => {
                  setSelectedPoint(point.id);
                  const handleMouseMove = (event: MouseEvent) => {
                    event.preventDefault();
                    handleDrag(event, point.id);
                  };
                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                  };
                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
                className={`hover:fill-${
                  selectedPoint === point.id ? "purple" : "red"
                }-600`}
              />
            );
          })}
      </svg>

      {/* Save Points Button and Success Message */}
      {!mini &&
        onSave &&
        (usdUtilonPoints.some(
          (point, index) =>
            point.usd_amount !== initialPoints[index]?.usd_amount ||
            point.marginal_utility !== initialPoints[index]?.marginal_utility
        ) ||
          showSaveSuccess) && (
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save Estimate
            </button>
            {showSaveSuccess && (
              <span className="text-green-600 dark:text-green-400">
                ✓ Changes saved successfully
              </span>
            )}
          </div>
        )}

      {!mini &&
        usdUtilonPoints
          .sort((a, b) => a.usd_amount - b.usd_amount)
          .map((point) => (
            <div key={point.id}>
              <p>
                Point: usd=${Math.round(point.usd_amount).toLocaleString()},
                marginal_utility={Math.round(point.marginal_utility)}
              </p>
            </div>
          ))}
    </div>
  );
};

export default MarginalUtilityEditor;
