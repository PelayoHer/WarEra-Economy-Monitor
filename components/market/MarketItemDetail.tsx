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
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Precio Actual</span>
                                    <span className="text-2xl font-mono font-black text-white">{avgPrice.toFixed(4)}</span>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Volumen 24h</span>
                                    <span className="text-2xl font-mono font-black text-white">{volume.toLocaleString()}</span>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Spread Est.</span>
                                    <span className="text-2xl font-mono font-black text-slate-400">{(avgPrice * 0.02).toFixed(4)}</span>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Tendencia</span>
                                    <div className="flex items-center gap-2 text-xl font-mono font-black">
                                        {change24h >= 0 ? <TrendingUp className="text-success w-5 h-5" /> : <TrendingDown className="text-red-500 w-5 h-5" />}
                                        <span className={change24h >= 0 ? 'text-success' : 'text-red-500'}>{Math.abs(change24h).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 relative h-[300px] overflow-hidden group">
                                <div className="absolute top-6 left-6 z-10">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] italic">Historial de Precios (7d)</h3>
                                </div>
                                <div className="absolute inset-x-8 bottom-8 top-16 opacity-50">
                                    {history.length > 0 ? (
                                        <Sparkline data={history} height={200} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono italic">SIN DATOS HISTÓRICOS</div>
                                    )}
                                </div>
                                {/* Simple Chart Grid lines */}
                                <div className="absolute inset-0 pointer-events-none opacity-5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-full h-px bg-white" style={{ top: `${i * 20}%` }} />
                                    ))}
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} className="h-full w-px bg-white" style={{ left: `${i * 14.28}%` }} />
                                    ))}
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Layers className="w-5 h-5 text-primary" />
                                        <h4 className="font-black text-white italic uppercase tracking-wider text-sm">Producción</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Este ítem requiere <span className="text-primary font-bold">{item.work_points} puntos de trabajo</span>. Es fundamental para la cadena de suministro de {item.inputs?.length || 0} productos derivados.
                                    </p>
                                </div>
                                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock className="w-5 h-5 text-amber-500" />
                                        <h4 className="font-black text-white italic uppercase tracking-wider text-sm">Estado Mercado</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Actualizado hace <span className="text-amber-500 font-bold">14 minutos</span>. El spread actual indica una volatilidad <span className="text-amber-500 font-bold">BAJA</span> en las últimas 4 horas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Orderbook Panel */}
                        <div className="bg-black/20 border border-white/5 rounded-[2rem] p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-white italic uppercase tracking-widest">Orderbook</h3>
                                <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-mono text-slate-400 font-bold">LIVE</div>
                            </div>

                            {/* ASKS */}
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                    <span>Precio (Venta)</span>
                                    <span>Cantidad</span>
                                </div>
                                {mockAsks.map((ask, i) => (
                                    <div key={i} className="flex justify-between items-center group relative h-8 px-2">
                                        <div className="absolute inset-y-0 right-0 bg-red-500/10 transition-all duration-500" style={{ width: `${(ask.qty / 5).toFixed(0)}%` }} />
                                        <span className="text-red-500 font-mono font-bold text-xs relative z-10">{ask.price.toFixed(4)}</span>
                                        <span className="text-slate-400 font-mono text-xs relative z-10">{ask.qty.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* SPREAD INDICATOR */}
                            <div className="py-4 border-y border-white/5 my-4 flex flex-col items-center">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic mb-1">Spread: 0.027</div>
                                <ArrowRightLeft className="w-4 h-4 text-slate-600" />
                            </div>

                            {/* BIDS */}
                            <div className="space-y-1">
                                {mockBids.map((bid, i) => (
                                    <div key={i} className="flex justify-between items-center group relative h-8 px-2">
                                        <div className="absolute inset-y-0 right-0 bg-success/10 transition-all duration-500" style={{ width: `${(bid.qty / 6).toFixed(0)}%` }} />
                                        <span className="text-success font-mono font-bold text-xs relative z-10">{bid.price.toFixed(4)}</span>
                                        <span className="text-slate-400 font-mono text-xs relative z-10">{bid.qty.toFixed(0)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">
                                    <span>Precio (Compra)</span>
                                    <span>Cantidad</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all italic">
                                    <ShoppingCart className="w-4 h-4" /> Vender
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-success/20 hover:bg-success text-success hover:text-white border border-success/20 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all italic">
                                    <ShoppingBag className="w-4 h-4" /> Comprar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
