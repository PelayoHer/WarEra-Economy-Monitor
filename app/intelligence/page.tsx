'use client';

import React, { useEffect, useState } from 'react';
import { translations, Language } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AuthGate from '@/components/intelligence/AuthGate';
import {
    Users, Shield, Heart, Utensils, Zap,
    Activity, ChevronDown, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntelUser {
    id: string;
    username: string;
    avatar: string | null;
    health: number;
    hunger: number;
    energy: number;
    level: number;
    rank: number;
    lastActive: string;
    hasPill?: boolean;
}

interface IntelMU {
    id: string;
    name: string;
    avatar: string | null;
    members: IntelUser[];
}

export default function IntelligencePage() {
    const [language] = useLocalStorage<Language>('language', 'es');
    const [data, setData] = useState<IntelMU[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const t = translations[language];

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/intelligence');
            if (!res.ok) throw new Error('API unreachable');
            const json = await res.json();
            setData(json.mus || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Shared Background Layers */}
            <div className="fixed inset-0 mesh-gradient-bg" />
            <div className="fixed inset-0 tactical-grid" />
            <div className="fixed inset-0 particles" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                <header className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                    >
                        <Shield className="w-3 h-3" />
                        Tactical National Intelligence
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl sm:text-7xl font-black text-foreground tracking-tighter uppercase italic drop-shadow-2xl"
                    >
                        {t.intelligenceTitle}
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-10 pt-4"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-primary italic">{data.reduce((acc, mu) => acc + mu.members.length, 0)}</span>
                            <span className="text-[10px] text-foreground/40 font-mono uppercase tracking-[0.2em] italic font-bold">{t.compatriotsLabel}</span>
                        </div>
                        <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-primary italic">{data.length}</span>
                            <span className="text-[10px] text-foreground/40 font-mono uppercase tracking-[0.2em] italic font-bold">{t.unitsLabel}</span>
                        </div>
                    </motion.div>
                </header>

                <AuthGate>
                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-64 rounded-[3rem] glass-card animate-pulse shadow-2xl" />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start"
                        >
                            {data.map((mu, index) => (
                                <motion.div
                                    key={mu.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, type: 'spring', damping: 20 }}
                                >
                                    <MUCard mu={mu} language={language} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {!loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="space-y-8 pt-20"
                        >
                            <div className="flex flex-col items-center gap-4 text-center">
                                <h2 className="text-4xl font-black text-foreground uppercase italic tracking-tighter drop-shadow-lg">
                                    Registro de Despliegue Nacional
                                </h2>
                                <p className="text-foreground/40 text-sm font-mono uppercase tracking-[0.2em]">Resumen operativo de fuerzas activas</p>
                            </div>
                            <CombatSummaryTable data={data} t={t} />
                        </motion.div>
                    )}
                </AuthGate>
            </div>
        </main>
    );
}

function CombatSummaryTable({ data, t }: { data: IntelMU[]; t: any }) {
    // Flatten all members and add MU name to each
    const allMembers = data.flatMap(mu =>
        mu.members.map(m => ({ ...m, muName: mu.name, muAvatar: mu.avatar }))
    ).sort((a, b) => b.rank - a.rank);

    return (
        <div className="glass-card rounded-[3rem] border border-border/20 overflow-hidden shadow-2xl backdrop-blur-3xl">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-primary/10 border-b border-primary/20">
                            <th className="px-8 py-5 text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">{t.rank}</th>
                            <th className="px-8 py-5 text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">Agente</th>
                            <th className="px-8 py-5 text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">Unidad</th>
                            <th className="px-8 py-5 text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">{t.level}</th>
                            <th className="px-8 py-5 text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">{t.intelRank}</th>
                            <th className="px-8 py-5 text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">{t.healthStatus}</th>
                            <th className="px-8 py-5 text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                        {allMembers.map((member, idx) => {
                            const isReady = member.health >= 90 && member.hasPill;
                            return (
                                <tr key={member.id} className="group hover:bg-primary/5 transition-colors">
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-mono font-black text-foreground/20 italic">#{idx + 1}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-secondary border border-border/50 flex-shrink-0">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-foreground/20 italic font-black">?</div>
                                                )}
                                            </div>
                                            <span className="font-black text-lg tracking-tighter uppercase italic group-hover:text-primary transition-colors truncate max-w-[150px]">
                                                {member.username}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            {member.muAvatar ? (
                                                <img src={member.muAvatar} alt="" className="w-5 h-5 rounded-md opacity-60" />
                                            ) : (
                                                <Shield className="w-4 h-4 text-foreground/20" />
                                            )}
                                            <span className="text-[10px] font-mono font-bold text-foreground/40 uppercase truncate max-w-[120px]">
                                                {member.muName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="font-mono font-black text-primary italic bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                            {member.level}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="font-mono font-black text-primary text-xl drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">
                                            {member.rank}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                                            <div className="flex justify-between text-[10px] font-mono font-black">
                                                <span className={member.health < 50 ? 'text-red-500' : 'text-foreground/40'}>{Math.round(member.health)}%</span>
                                            </div>
                                            <div className="h-1.5 w-24 bg-secondary/50 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${member.health < 50 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]'}`}
                                                    style={{ width: `${Math.min(member.health, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            {member.hasPill && (
                                                <div className="flex items-center gap-1 text-[9px] font-mono font-black text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20 animate-pulse">
                                                    <Activity className="w-3 h-3" />
                                                    PILL
                                                </div>
                                            )}
                                            {isReady && (
                                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" title="COMBAT READY" />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MUCard({ mu, language }: { mu: IntelMU; language: Language }) {
    const t = translations[language];
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="glass-card rounded-[3rem] border border-border/50 hover:border-primary/40 transition-all duration-500 overflow-hidden flex flex-col group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            {/* Header */}
            <div className="p-8 relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-secondary/80 border border-border/50 flex-shrink-0 flex items-center justify-center group-hover:rotate-6 transition-all duration-500 overflow-hidden shadow-2xl ring-2 ring-white/5">
                            {mu.avatar ? (
                                <img src={mu.avatar} alt={mu.name} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-10 h-10 text-primary/60" />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-3xl font-black text-foreground group-hover:text-primary transition-colors leading-none tracking-tighter italic uppercase">
                                {mu.name}
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                                    <Users className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.1em] italic leading-none">
                                        {t.muCount.replace('{count}', mu.members.length.toString())}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className="transition-all">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full py-5 px-10 hover:bg-primary/10 border-t border-border/10 flex items-center justify-between group/btn transition-all group-hover:bg-primary/5"
                >
                    <span className="text-sm font-black uppercase tracking-[0.3em] text-foreground/30 group-hover/btn:text-primary transition-colors italic">
                        {expanded ? (language === 'es' ? 'Ocultar Manifiesto' : 'Hide Manifest') : (language === 'es' ? 'Analizar Miembros' : 'Analyze Members')}
                    </span>
                    <ChevronDown className={`w-6 h-6 text-foreground/20 group-hover/btn:text-primary transition-all duration-500 ${expanded ? 'rotate-180' : 'group-hover:translate-y-1'}`} />
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <div className="px-6 pb-10 max-h-[700px] overflow-y-auto space-y-4 custom-scrollbar">
                                {mu.members.map(member => (
                                    <MemberRow key={member.id} member={member} t={t} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function MemberRow({ member, t }: { member: IntelUser; t: any }) {
    const hasPill = member.hasPill;

    return (
        <div className={`glass-card p-6 rounded-[2.5rem] group/member border-border/20 hover:border-primary/40 transition-all shadow-xl relative overflow-hidden ${hasPill ? 'bg-primary/[0.05]' : 'bg-background/40 hover:bg-primary/[0.08]'}`}>
            <div className="flex items-start gap-6 relative z-10">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden bg-secondary/80 border border-border/50 shadow-inner">
                        {member.avatar ? (
                            <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-foreground/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                    </div>
                    {hasPill && (
                        <div className="absolute -top-1 -right-1 bg-primary text-background p-1.5 rounded-full shadow-lg border-2 border-background animate-bounce z-20">
                            <Activity className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>

                <div className="flex-grow min-w-0 space-y-4">
                    {/* Top row: Name & Level */}
                    <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                            <span className="font-black text-2xl tracking-tighter uppercase italic truncate block group-hover/member:text-primary transition-colors">
                                {member.username}
                            </span>
                            {hasPill && (
                                <span className="text-[8px] font-mono text-primary font-black uppercase tracking-[0.2em] mt-1 block">
                                    [ STIMULANT_ACTIVE ]
                                </span>
                            )}
                        </div>
                        <div className="flex-shrink-0 bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl text-primary font-black italic">
                            <span className="text-[9px] opacity-40 uppercase mr-1 not-italic font-mono">Lvl</span>
                            {member.level}
                        </div>
                    </div>

                    {/* Combat Stat: Health */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-end px-1">
                            <div className="flex items-center gap-2">
                                <Heart className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-[10px] font-mono font-black text-foreground/40 uppercase tracking-widest">{t.healthStatus}</span>
                            </div>
                            <span className="text-sm font-mono font-black text-red-500 italic">{Math.round(member.health)}<span className="text-[10px] opacity-40 uppercase not-italic ml-1">HP</span></span>
                        </div>
                        <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-white/5 p-0.5">
                            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${Math.min(member.health, 100)}%` }} />
                        </div>
                    </div>

                    {/* Footer Stats: Rank, Energy, Hunger */}
                    <div className="grid grid-cols-3 gap-6 pt-3 border-t border-border/10">
                        <div className="space-y-1">
                            <span className="text-[8px] font-mono font-black text-foreground/20 uppercase tracking-widest block">{t.intelRank}</span>
                            <span className="text-xl font-black text-primary italic leading-none block">{member.rank}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-mono font-black text-foreground/20 uppercase tracking-widest block">{t.energyStatus}</span>
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-primary opacity-60" />
                                <span className="text-sm font-black italic">{Math.round(member.energy)}%</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-mono font-black text-foreground/20 uppercase tracking-widest block">{t.hungerStatus}</span>
                            <div className="flex items-center gap-1.5">
                                <Utensils className="w-3.5 h-3.5 text-amber-500 opacity-60" />
                                <span className="text-sm font-black italic">{Math.round(member.hunger)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
