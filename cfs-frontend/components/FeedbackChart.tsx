
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  Good: number;
  Average: number;
  'Needs Improvement': number;
  Poor: number;
}


interface FeedbackChartProps {
  data?: ChartData[];
  title: string;
  question?: {
    text: string;
  };
}

const FeedbackChart: React.FC<FeedbackChartProps> = ({ data = [], title, question }) => {
  // Filter and sanitize data for chart
  const validData = Array.isArray(data)
    ? data
      .filter(item => item && typeof item === 'object')
      .map(item => {
        // Create a new object to avoid mutating the input
        const processedItem = { ...item };

        // Ensure name is a valid string
        if (typeof processedItem.name !== 'string' || !processedItem.name.trim()) {
          return null;
        }

        // Validate and normalize all rating values
        const ratingKeys = ['Good', 'Average', 'Needs Improvement', 'Poor'];
        for (const key of ratingKeys) {
          const value = Number(processedItem[key]);
          if (isNaN(value)) {
            processedItem[key] = 0;
          } else {
            processedItem[key] = Math.max(0, Math.min(100, value));
          }
        }

        // Check if there's at least one non-zero rating
        const hasRatings = ratingKeys.some(key => processedItem[key] > 0);
        return hasRatings ? processedItem : null;
      })
      .filter(Boolean) // Remove null entries
    : [];

  // Validate the processed data
  if (!validData.length) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center text-gray-500">
        No data available or no valid feedback for this selection.
      </div>
    );
  }

  // Ensure we have at least one valid entry with a name and some ratings
  const hasValidEntries = validData.some(item =>
    item &&
    typeof item.name === 'string' &&
    (Number(item.Good) > 0 || Number(item.Average) > 0 || Number(item['Needs Improvement']) > 0 || Number(item.Poor) > 0)
  );

  if (!hasValidEntries) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center text-gray-500">
        No rating data available for the current selection.
      </div>
    );
  }

  // Final safety: ensure all rating keys exist and are numbers for every row
  const ratingKeys = ['Good', 'Average', 'Needs Improvement', 'Poor'];
  const sanitizedData = validData.map(row => {
    const out: any = { ...row };
    ratingKeys.forEach(k => {
      out[k] = Number(out[k]) || 0;
    });
    // Ensure name is string
    out.name = String(out.name || '').trim();
    return out;
  });

  // Ensure at least one numeric key is present across the dataset
  const hasNumeric = ratingKeys.some(k => sanitizedData.some(d => typeof d[k] === 'number'));
  if (!hasNumeric) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center text-gray-500">
        No numeric rating data available for the current selection.
      </div>
    );
  }

  // Error boundary for chart rendering
  try {
    return (
      <div className="h-[400px] w-full">
        <ResponsiveContainer>
          <BarChart
            data={sanitizedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            barSize={20}
            layout="vertical"
            stackOffset="none"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis
              dataKey="name"
              type="category"
              width={200}
              tick={({ x, y, payload }) => {
                if (!payload || payload.value == null) return null;
                const label = String(payload.value);
                return (
                  <text x={x} y={y} dy={4} textAnchor="end" fill="#666" fontSize={12}>
                    {label.length > 30 ? label.substring(0, 30) + '...' : label}
                  </text>
                );
              }}
            />
            <Tooltip
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
              cursor={{ fill: 'transparent' }}
              content={({ active, payload, label }) => {
                if (active && Array.isArray(payload) && payload.length) {
                  return (
                    <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-800 mb-2">{label}</p>
                      {payload.map((entry: any, index: number) => {
                        if (!entry) return null;
                        const value = Number(entry.value) || 0;
                        return (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="font-medium">{entry.name}:</span>
                            <span>{value.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {ratingKeys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={idx === 0 ? '#22c55e' : idx === 1 ? '#eab308' : idx === 2 ? '#f97316' : '#ef4444'}
                stackId="stack"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (err) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center text-red-500">
        Chart rendering error
      </div>
    );
  }
};

export default FeedbackChart;
