import React from 'react';

interface SparklineProps {
    data: { valueAt: string; avgValue: number }[];
    color?: string;
    width?: number;
    height?: number;
}

export function Sparkline({ data, color = 'rgba(34, 197, 94, 0.2)', width = 200, height = 50 }: SparklineProps) {
    if (!data || data.length < 2) return null;

    const values = data.map(d => d.avgValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const lastVal = values[values.length - 1];
    const prevVal = values[values.length - 2];
    const isUp = lastVal >= prevVal;

    const strokeColor = isUp ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    const fillColor = isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={`M 0,${height} ${points.split(' ').map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(' ')} L ${width},${height} Z`}
                fill="url(#gradient)"
            />
            <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}
