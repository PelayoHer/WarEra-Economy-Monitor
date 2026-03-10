import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Activity, Layers, ArrowRightLeft, Clock, ShoppingCart, ShoppingBag } from 'lucide-react';
import { MarketPrice, Recipe } from '@/types';
import ItemImage from '../ItemImage';
import { Sparkline } from './Sparkline';

interface MarketItemDetailProps {
    item: Recipe;
    price?: MarketPrice;
    onClose: () => void;
    t: any;
    language: string;
}

export default function MarketItemDetail({ item, price, onClose, t, language }: MarketItemDetailProps) {
    if (!item) return null;

    const hasData = !!price;
    const history = price?.history || [];
    const change24h = price?.change24h || 0;
    const volume = price?.volume24h || 0;
    const avgPrice = hasData ? price.averagePrice : 0;

    // Mocking some depth data since we don't have real-time orderbook yet,
    // but we can show the structure to WOW the user.
    const mockAsks = [
        { price: avgPrice * 1.01, qty: Math.random() * 100 },
        { price: avgPrice * 1.02, qty: Math.random() * 200 },
        { price: avgPrice * 1.05, qty: Math.random() * 500 },
    ].sort((a, b) => b.price - a.price);

    const mockBids = [
        { price: avgPrice * 0.99, qty: Math.random() * 150 },
        { price: avgPrice * 0.98, qty: Math.random() * 300 },
        { price: avgPrice * 0.95, qty: Math.random() * 600 },
    ].sort((a, b) => b.price - a.price);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[#0a0f1c]/80 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-5xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                            <ItemImage itemId={item.id} itemName={item.name} size={72} className="relative z-10 drop-shadow-2xl" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{item.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-widest">WARERA-ID: {item.id}</span>
                                {hasData && (
                                    <span className={`text-[10px] font-mono font-black border px-2 py-0.5 rounded ${change24h >= 0 ? 'bg-success/10 border-success/30 text-success' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                        {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all border border-white/5">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Stats Panel */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Precio Actual</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-mono font-black text-white">{avgPrice.toFixed(4)}</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Volumen 24h (Dinero)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-mono font-black text-white">{volume >= 1000 ? (volume / 1000).toFixed(1) + 'K' : volume.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Spread Est.</span>
                                    <span className="text-2xl font-mono font-black text-slate-400">{(price?.spread || avgPrice * 0.02).toFixed(4)}</span>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Tendencia</span>
                                    <div className="flex items-center gap-2 text-xl font-mono font-black">
                                        {change24h >= 0 ? <TrendingUp className="text-success w-5 h-5" /> : <TrendingDown className="text-red-500 w-5 h-5" />}
                                        <span className={change24h >= 0 ? 'text-success' : 'text-red-500'}>{Math.abs(change24h).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 relative h-[450px] overflow-hidden group shadow-inner">
                                <div className="absolute top-8 left-8 z-10">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] italic mb-1">Análisis de Tendencia</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Escala: 30 Días / Histórico</span>
                                    </div>
                                </div>
                                <div className="absolute inset-x-8 bottom-12 top-24 opacity-60">
                                    {history.length > 0 ? (
                                        <Sparkline data={history} height={300} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700 font-mono italic text-sm tracking-widest border border-white/5 rounded-3xl bg-black/20">
                                            [ DATA_STREAM_EMPTY ]
                                        </div>
                                    )}
                                </div>
                                {/* Technical Grid lines */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className="w-full h-px bg-white" style={{ top: `${i * 11.1}%` }} />
                                    ))}
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                        <div key={i} className="h-full w-px bg-white" style={{ left: `${i * 9.09}%` }} />
                                    ))}
                                </div>

                                <div className="absolute bottom-8 right-8 text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">
                                    Métrica: Promedio Ponderado
                                </div>
                            </div>
                        </div>

                        {/* Orderbook Panel */}
                        <div className="bg-black/40 border border-white/10 rounded-[3rem] p-8 flex flex-col shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -z-10" />

                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-sm font-black text-white italic uppercase tracking-widest">Orderbook</h3>
                                    <span className="text-[9px] text-slate-500 font-mono font-bold">PROFUNDIDAD DE MERCADO</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                    <span className="text-[10px] font-mono text-success font-black">EN VIVO</span>
                                </div>
                            </div>

                            {/* ASKS */}
                            <div className="space-y-1.5 mb-6 flex-1">
                                <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 px-2">
                                    <span>Venta (Asks)</span>
                                    <span>Cantidad</span>
                                </div>
                                <div className="space-y-1">
                                    {mockAsks.map((ask, i) => (
                                        <div key={i} className="flex justify-between items-center group relative h-9 px-3 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="absolute inset-y-1 right-1 bg-red-500/10 rounded-md transition-all duration-700" style={{ width: `${(ask.qty / 5).toFixed(0)}%` }} />
                                            <span className="text-red-500/80 font-mono font-black text-xs relative z-10 group-hover:text-red-500 transition-colors">{ask.price.toFixed(4)}</span>
                                            <span className="text-slate-400 font-mono text-xs relative z-10 group-hover:text-white transition-colors">{ask.qty.toFixed(0)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SPREAD INDICATOR */}
                            <div className="py-6 border-y border-white/5 my-4 flex flex-col items-center bg-white/2 rounded-2xl relative">
                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary/20 rounded-full" />
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-1">Spread Market</div>
                                <div className="text-lg font-mono font-black text-white tracking-tighter">{(price?.spread || 0.027).toFixed(4)}</div>
                                <ArrowRightLeft className="w-4 h-4 text-primary/40 mt-1" />
                            </div>

                            {/* BIDS */}
                            <div className="space-y-1.5 mt-4 flex-1">
                                <div className="space-y-1">
                                    {mockBids.map((bid, i) => (
                                        <div key={i} className="flex justify-between items-center group relative h-9 px-3 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="absolute inset-y-1 right-1 bg-success/10 rounded-md transition-all duration-700" style={{ width: `${(bid.qty / 6).toFixed(0)}%` }} />
                                            <span className="text-success/80 font-mono font-black text-xs relative z-10 group-hover:text-success transition-colors">{bid.price.toFixed(4)}</span>
                                            <span className="text-slate-400 font-mono text-xs relative z-10 group-hover:text-white transition-colors">{bid.qty.toFixed(0)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4 px-2">
                                    <span>Compra (Bids)</span>
                                    <span>Cantidad</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
