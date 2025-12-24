
import React from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

interface ChartProps {
    data: Record<string, unknown>[];
    dataKey?: string;
    nameKey?: string;
    color?: string; // Main color
    xAxisKey?: string;
}

const COLORS = ['#D4AF37', '#22C55E', '#3B82F6', '#EF4444', '#A855F7'];

export const AnalysisLineChart: React.FC<ChartProps & { lines?: { key: string; color: string }[] }> = ({ data, xAxisKey = 'name', lines }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey={xAxisKey} stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                    itemStyle={{ color: '#D4AF37' }}
                />
                <Legend />
                {lines ? (
                    lines.map((l, i) => (
                        <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} activeDot={{ r: 8 }} strokeWidth={2} />
                    ))
                ) : (
                    <Line type="monotone" dataKey="value" stroke="#D4AF37" activeDot={{ r: 8 }} strokeWidth={2} />
                )}
            </LineChart>
        </ResponsiveContainer>
    );
};

export const AnalysisBarChart: React.FC<ChartProps & { bars?: { key: string; color: string }[] }> = ({ data, xAxisKey = 'name', bars }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey={xAxisKey} stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                    cursor={{ fill: '#ffffff05' }}
                />
                <Legend />
                {bars ? (
                    bars.map((b, i) => (
                        <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[4, 4, 0, 0]} />
                    ))
                ) : (
                    <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                )}
            </BarChart>
        </ResponsiveContainer>
    );
};

export const AnalysisPieChart: React.FC<ChartProps> = ({ data, dataKey = 'value', nameKey = 'name' }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={dataKey}
                    nameKey={nameKey}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};
