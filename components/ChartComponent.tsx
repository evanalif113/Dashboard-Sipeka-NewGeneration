// components/ChartComponent.tsx
"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface ChartComponentProps {
  data: any[];
  layout: any;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data, layout }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render Plotly on server
  if (!mounted) return null;

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", height: "400px" }}
    />
  );
};

export default ChartComponent;
