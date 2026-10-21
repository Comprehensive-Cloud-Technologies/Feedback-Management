import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface AverageChartData {
    name: string;
    fullName?: string;
    value: number; // Average rating 0-4
    color?: string;
}

interface AverageRatingChartProps {
    data: AverageChartData[];
}

// 5 base theme colors in exact specified order (Image / Theme baseline)
const BASE_COLORS = ['#00C9E0', '#3B4FC9', '#F62A67', '#FFBB28', '#FF8042'];

/**
 * Returns a distinct, theme-friendly color for any given index.
 * - Indices 0-4 strictly preserve the 5 base theme colors in order.
 * - Indices 5+ use a deterministic golden-angle HSL distribution with high contrast & vibrant saturation.
 */
export const getBarColor = (index: number, customColor?: string): string => {
    if (customColor) return customColor;
    if (index < BASE_COLORS.length) {
        return BASE_COLORS[index];
    }
    // Golden angle hue distribution: (index * 137.508) % 360 gives well-separated hues
    const hue = Math.round((index * 137.508) % 360);
    return `hsl(${hue}, 72%, 48%)`;
};

const AverageRatingChart: React.FC<AverageRatingChartProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [showTicks, setShowTicks] = useState<boolean>(true);

    // Measure real rendered width reactively via ResizeObserver
    useEffect(() => {
        if (!containerRef.current) return;

        // Initial measurement
        const initialWidth = containerRef.current.clientWidth;
        if (initialWidth > 0) {
            setContainerWidth(initialWidth);
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width > 0) {
                    setContainerWidth(width);
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Dynamically evaluate whether all labels fit under bars without overlap
    useEffect(() => {
        if (!data || data.length === 0 || containerWidth <= 0) {
            setShowTicks(true);
            return;
        }

        // Plot width = containerWidth - leftMargin - rightMargin - yAxisWidth
        const leftMargin = 20;
        const rightMargin = 30;
        const yAxisWidth = 35;
        const availablePlotWidth = Math.max(0, containerWidth - leftMargin - rightMargin - yAxisWidth);
        const slotWidth = availablePlotWidth / data.length;

        let fits = true;
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.font = '12px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            }

            // Minimum padding between adjacent labels
            const PADDING = 8;
            for (const item of data) {
                const text = item.name || '';
                const measuredWidth = ctx ? ctx.measureText(text).width : text.length * 7.5;
                if (measuredWidth + PADDING > slotWidth) {
                    fits = false;
                    break;
                }
            }
        } catch {
            const PADDING = 8;
            for (const item of data) {
                const text = item.name || '';
                const estimatedWidth = text.length * 7.5;
                if (estimatedWidth + PADDING > slotWidth) {
                    fits = false;
                    break;
                }
            }
        }

        setShowTicks(fits);
    }, [containerWidth, data]);

    if (!data || data.length === 0) {
        return (
            <div className="h-[320px] w-full flex items-center justify-center text-gray-400 font-medium italic">
                No chart data available for current filters
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full flex flex-col">
            {/* Fixed sensible plot height for the bar chart */}
            <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: showTicks ? 20 : 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={showTicks ? { fontSize: 12, fill: '#666' } : false}
                            interval={0}
                            dy={showTicks ? 10 : 0}
                            height={showTicks ? 40 : 5}
                        />
                        <YAxis
                            domain={[0, 4]}
                            ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#666' }}
                            width={35}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as AverageChartData;
                                    const rawVal = item.value;
                                    const displayVal = typeof rawVal === 'number' ? rawVal.toFixed(2) : Number(rawVal || 0).toFixed(2);
                                    return (
                                        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl z-50 pointer-events-none">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                {item.fullName || item.name}
                                            </p>
                                            <p className="text-sm font-black text-primary-600">
                                                Avg Rating: {displayVal}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={60}
                            isAnimationActive={false}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={getBarColor(index, entry.color)}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Colour-coded legend - always within card bounds, wrapping cleanly, visible in print */}
            <div
                className={`flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4 px-2 ${
                    data.length > 60 ? 'max-h-[220px] overflow-y-auto custom-scrollbar' : ''
                }`}
                role="list"
                aria-label="Question Rating Legend"
            >
                {data.map((entry, index) => {
                    const fullTitle = entry.fullName || entry.name;
                    const color = getBarColor(index, entry.color);
                    return (
                        <div
                            key={`legend-${index}-${entry.name}`}
                            className="flex items-center gap-2 group cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-1 focus:ring-primary-400 rounded px-1.5 py-0.5"
                            title={fullTitle}
                            aria-label={`${fullTitle}: ${entry.name}`}
                            tabIndex={0}
                            role="listitem"
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0"
                                style={{ backgroundColor: color }}
                                aria-hidden="true"
                            />
                            <span className="text-[11px] text-gray-600 font-bold uppercase tracking-tight whitespace-nowrap">
                                {entry.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AverageRatingChart;
