import React, { useState, useRef } from 'react';

interface Point {
  id: number;
  x: number;
  y: number;
}

const MarginalUtilityEditor = () => {
  // SVG viewport constants
  const width = 400;
  const height = 400;
  const padding = 40;

  // Add text padding for labels
  const textPadding = 10;

  // Scale values
  const maxDollars = 10000000; // $10M
  const maxUtilons = 100;

  // Initial state: one point on y-axis, one on x-axis
  const [points, setPoints] = useState<Point[]>([
    { id: 1, x: padding, y: 150 },  // Point on y-axis
    { id: 2, x: 150, y: height - padding }  // Point on x-axis
  ]);
  const [nextId, setNextId] = useState(3);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  
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
    const newX = Math.max(padding, Math.min(width - padding, coords.x));
    const newY = Math.max(padding, Math.min(height - padding, coords.y));
    
    setPoints(points.map(point => 
      point.id === pointId ? { ...point, x: newX, y: newY } : point
    ));
  };

  const addPoint = () => {
    const newPoint = {
      id: nextId,
      x: Math.random() * (width - 2 * padding) + padding,
      y: Math.random() * (height - 2 * padding) + padding
    };
    setPoints([...points, newPoint]);
    setNextId(nextId + 1);
  };

  const deleteSelectedPoint = () => {
    if (selectedPoint !== null && points.length > 2) {
      setPoints(points.filter(point => point.id !== selectedPoint));
      setSelectedPoint(null);
    }
  };

  const sortedPoints = [...points].sort((a, b) => a.x - b.x);

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold text-center mb-4">Marginal Utility Editor</h2>
      <div className="mb-4 space-x-2">
        <button 
          onClick={addPoint}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Point
        </button>
        <button 
          onClick={deleteSelectedPoint}
          disabled={selectedPoint === null || points.length <= 2}
          className={`font-bold py-2 px-4 rounded ${
            selectedPoint !== null && points.length > 2
              ? 'bg-red-500 hover:bg-red-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Delete Selected Point
        </button>
      </div>
      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        className="bg-white border border-gray-300 rounded-lg"
      >
        {/* Axes */}
        <line 
          x1={padding} 
          y1={height - padding} 
          x2={width - padding} 
          y2={height - padding} 
          stroke="black" 
          strokeWidth="2"
        />
        <line 
          x1={padding} 
          y1={padding} 
          x2={padding} 
          y2={height - padding} 
          stroke="black" 
          strokeWidth="2"
        />
        
        {/* X-axis label and values */}
        <text
          x={width / 2}
          y={height - textPadding}
          textAnchor="middle"
          className="text-sm"
        >
          k dollars
        </text>
        <text
          x={padding}
          y={height - textPadding}
          textAnchor="middle"
          className="text-sm"
        >
          0
        </text>
        <text
          x={width - padding}
          y={height - textPadding}
          textAnchor="middle"
          className="text-sm"
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
        >
          utilons
        </text>
        <text
          x={padding - textPadding}
          y={height - padding}
          textAnchor="end"
          className="text-sm"
        >
          0
        </text>
        <text
          x={padding - textPadding}
          y={padding}
          textAnchor="end"
          className="text-sm"
        >
          100
        </text>
        
        {/* Lines connecting points */}
        <path 
          d={`M ${sortedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
          stroke="blue" 
          strokeWidth="2"
          fill="none"
        />
        
        {/* Draggable points */}
        {points.map(point => (
          <circle 
            key={point.id}
            cx={point.x} 
            cy={point.y} 
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
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            className={`hover:fill-${selectedPoint === point.id ? 'purple' : 'red'}-600`}
          />
        ))}
      </svg>

      {sortedPoints.map(point => (
        <div key={point.id}>
          <p>
            Point {point.id}: 
            usd=${Math.round(((point.x - padding) / (width - padding)) * maxDollars).toLocaleString()}, 
            utilons={Math.round(((height - point.y - padding) / (height - padding)) * maxUtilons)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MarginalUtilityEditor;