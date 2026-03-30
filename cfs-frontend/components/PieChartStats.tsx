import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieChartStatsProps {
  title: string;
  data: { name: string; value: number }[];
  colors?: string[];
  height?: number | string;
  bare?: boolean;
}

const defaultColors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

const PieChartStats: React.FC<PieChartStatsProps> = ({
  title,
  data,
  colors = defaultColors,
  height = 300,
  bare = false
}) => {
  const validData = Array.isArray(data)
    ? data.filter(item => item && typeof item.name === 'string' && typeof item.value === 'number' && !isNaN(item.value))
    : [];

  const wrapperClass = bare ? "w-full" : "bg-white rounded-lg p-4 mb-6";

  if (!validData.length) {
    return <div className={`flex items-center justify-center text-gray-500 w-full`} style={{ height }}>No data available</div>;
  }

  // Filter out zero values for cleaner chart
  const activeData = validData.filter(d => d.value > 0);

  return (
    <div className={wrapperClass}>
      {title && <h3 className="text-md font-semibold mb-4 text-center">{title}</h3>}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={activeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"

              outerRadius="70%"
              innerRadius={0}
              paddingAngle={2}

              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              isAnimationActive={false}
            >
              {activeData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[validData.indexOf(entry) % colors.length]} />
              ))}
            </Pie>
            {/* Grid Adjustment - Restore Grid for Print */}
            <Tooltip formatter={(value: number) => value} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PieChartStats;
