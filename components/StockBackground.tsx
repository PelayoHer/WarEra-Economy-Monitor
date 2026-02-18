export const StockBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.07]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="stock-grid" x="0" y="0" width="150" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
                    <text x="10" y="30" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="rgba(56, 189, 248, 0.8)">WARERA</text>
                    <text x="80" y="30" fontFamily="monospace" fontSize="12" fill="rgba(34, 197, 94, 0.8)">+2.4%</text>
                    <text x="20" y="60" fontFamily="monospace" fontSize="12" fill="rgba(255, 255, 255, 0.5)">245.50</text>
                    <text x="80" y="60" fontFamily="monospace" fontSize="12" fill="rgba(239, 68, 68, 0.8)">-0.12%</text>
                    <text x="120" y="45" fontFamily="monospace" fontSize="10" fill="rgba(255, 255, 255, 0.3)">BUY</text>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stock-grid)" />
        </svg>
    </div>
);
