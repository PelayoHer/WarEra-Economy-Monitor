'use client';

import React, { useEffect, useState } from 'react';
import { translations, Language } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AuthGate from '@/components/intelligence/AuthGate';
import {
    Users, Shield, Heart, Utensils, Zap,
    ArrowUpFromLine, Activity, Target, Clock,
    ChevronDown, User
} from 'lucide-react';
import { motion } from 'framer-motion';

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

            <div className={`max-w-7xl mx-auto space-y-12 relative z-10 transition-all duration-500`}>
                <header className="text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl font-black text-foreground tracking-tighter uppercase italic"
                    >
                        {t.intelligenceTitle}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-foreground/60 max-w-2xl mx-auto text-lg leading-relaxed"
                    >
                        {t.secretTitle}
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-10 pt-4"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]">{data.reduce((acc, mu) => acc + mu.members.length, 0)}</span>
                            <span className="text-[10px] text-foreground/40 font-mono uppercase tracking-[0.2em] italic font-bold">{t.compatriotsLabel}</span>
                        </div>
                        <div className="w-px h-10 bg-gradient-to-b from-transparent via-border/60 to-transparent" />
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]">{data.length}</span>
                            <span className="text-[10px] text-foreground/40 font-mono uppercase tracking-[0.2em] italic font-bold">{t.unitsLabel}</span>
                        </div>
                    </motion.div>
                </header>

                <AuthGate>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 rounded-[2.5rem] glass-card animate-pulse shadow-2xl" />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start"
                        >
                            {data.map((mu, index) => (
                                <motion.div
                                    key={mu.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 + 0.4 }}
                                >
                                    <MUCard mu={mu} language={language} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AuthGate>
            </div>
        </main>
    );
}

function MUCard({ mu, language }: { mu: IntelMU; language: Language }) {
    const t = translations[language];
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="glass-card rounded-[2.5rem] border border-border/50 hover:border-primary/40 transition-all duration-500 overflow-hidden flex flex-col group shadow-2xl h-auto self-start">
            {/* Header */}
            <div className="p-8 relative">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-5 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden shadow-2xl ring-1 ring-white/10">
                            {mu.avatar ? (
                                <img src={mu.avatar} alt={mu.name} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-9 h-9 text-primary/60" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-none tracking-tight italic">
                                {mu.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-mono font-bold text-foreground/40 uppercase tracking-[0.1em] italic leading-none">
                                    {t.muCount.replace('{count}', mu.members.length.toString())}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members List Toggle */}
            <div className="transition-all">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full py-4 px-8 hover:bg-primary/5 border-t border-border/10 flex items-center justify-between group/btn transition-colors"
                >
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40 group-hover/btn:text-primary transition-colors italic">
                        {expanded ? (language === 'es' ? 'Ocultar datos' : 'Collapse data') : (language === 'es' ? 'Ver más miembros' : 'View more members')}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-foreground/20 group-hover/btn:text-primary transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                    <div className="px-6 pb-8 max-h-[600px] overflow-y-auto space-y-4 custom-scrollbar">
                        {mu.members.map(member => (
                            <MemberRow key={member.id} member={member} t={t} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MemberRow({ member, t }: { member: IntelUser; t: any }) {
    // Determine if pill (damage buff) is active
    // If not directly available, we can guess by name or a specific property if we had one
    const hasPill = member.hasPill;

    return (
        <div className="glass-card bg-background/40 p-6 rounded-[2.5rem] group/member border-border/20 hover:border-primary/40 hover:bg-primary/10 transition-all shadow-xl hover:shadow-primary/20 relative overflow-hidden">
            {/* Background Pill Accent */}
            {hasPill && (
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
            )}

            <div className="flex items-start gap-6 relative z-10">
                {/* Avatar Section */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary/80 flex-shrink-0 border border-border/50 shadow-inner group-hover/member:border-primary/30 transition-colors">
                        {member.avatar ? (
                            <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/20 italic font-black text-3xl">
                                <User className="w-10 h-10" />
                            </div>
                        )}
                    </div>
                    {/* Pill Badge */}
                    {hasPill && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-background p-1 rounded-full shadow-lg border-2 border-background ring-2 ring-primary/20 animate-bounce">
                            <Activity className="w-3 h-3" />
                        </div>
                    )}
                </div>

                <div className="flex-grow min-w-0">
                    {/* User Header */}
                    <div className="flex items-center justify-between gap-4 mb-5">
                        <div className="min-w-0">
                            <span className="font-black text-xl tracking-tight group-hover/member:text-primary transition-colors italic uppercase leading-none truncate block">
                                {member.username}
                            </span>
                            {hasPill && (
                                <span className="text-[8px] font-mono text-primary font-black uppercase tracking-widest mt-1 block animate-pulse">
                                    {t.itemNames?.cocain || 'Píldora'} Activa
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] font-mono text-foreground/30 font-black uppercase tracking-widest mb-0.5">{t.level}</span>
                            <span className="text-sm font-mono text-primary font-black italic bg-primary/10 border border-primary/20 px-3 py-0.5 shadow-sm rounded-lg backdrop-blur-sm">
                                {member.level}
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        {/* Health */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1">
                                    <Heart className="w-3 h-3 text-red-500" />
                                    <span className="text-[7px] font-mono font-black text-foreground/40 uppercase tracking-tighter">{t.healthStatus}</span>
                                </div>
                                <span className="text-[8px] font-mono font-black text-red-500 italic">{Math.round(member.health)}</span>
                            </div>
                            <div className="h-2 bg-secondary/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <div className="h-full bg-red-500 transition-all duration-1000 shadow-[0_0_8px_rgba(239,68,68,0.4)]" style={{ width: `${Math.min(member.health, 100)}%` }} />
                            </div>
                        </div>

                        {/* Energy */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-primary" />
                                    <span className="text-[7px] font-mono font-black text-foreground/40 uppercase tracking-tighter">{t.energyStatus}</span>
                                </div>
                                <span className="text-[8px] font-mono font-black text-primary italic">{Math.round(member.energy)}</span>
                            </div>
                            <div className="h-2 bg-secondary/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <div className="h-full bg-primary transition-all duration-1000 shadow-[0_0_8px_rgba(var(--primary),0.4)]" style={{ width: `${Math.min((member.energy / 100) * 100, 100)}%` }} />
                            </div>
                        </div>

                        {/* Hunger */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1">
                                    <Utensils className="w-3 h-3 text-amber-500" />
                                    <span className="text-[7px] font-mono font-black text-foreground/40 uppercase tracking-tighter">{t.hungerStatus}</span>
                                </div>
                                <span className="text-[8px] font-mono font-black text-amber-500 italic">{Math.round(member.hunger)}</span>
                            </div>
                            <div className="h-2 bg-secondary/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <div className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.4)]" style={{ width: `${Math.min(member.hunger, 100)}%` }} />
                            </div>
                        </div>

                        {/* Rank */}
                        <div className="flex flex-col items-end justify-center px-1">
                            <span className="text-[8px] font-mono font-black text-foreground/30 uppercase tracking-widest mb-0.5 leading-none">{t.intelRank}</span>
                            <div className="text-xl font-black text-primary leading-none italic drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]">
                                {member.rank}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
