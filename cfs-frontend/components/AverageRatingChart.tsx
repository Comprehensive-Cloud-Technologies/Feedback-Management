
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface AverageChartData {
    name: string;
    value: number; // Average rating 0-4
    color?: string;
}

interface AverageRatingChartProps {
    data: AverageChartData[];
}

const COLORS = ['#00C9E0', '#3B4FC9', '#F62A67', '#FFBB28', '#FF8042']; // Matches Image 3 approx (Cyan, Blue, Pink)

const AverageRatingChart: React.FC<AverageRatingChartProps> = ({ data }) => {
    return (
        <div className="h-[400px] w-full bg-white p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barSize={60}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                        interval={0}
                        dy={10}
                    />
                    <YAxis
                        domain={[0, 4]}
                        ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{data.fullName}</p>
                                        <p className="text-sm font-black text-primary-600">Avg Rating: {data.value.toFixed(2)}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} isAnimationActive={false}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Legend below - Fixed Overflow */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 max-h-[100px] overflow-y-auto px-2 custom-scrollbar no-print">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 group cursor-help transition-all hover:scale-105" title={entry.fullName}>
                        <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></span>
                        <span className="text-[11px] text-gray-500 font-black uppercase tracking-tighter whitespace-nowrap">
                            {entry.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AverageRatingChart;
