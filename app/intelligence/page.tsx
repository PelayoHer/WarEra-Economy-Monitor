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
        <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background relative overflow-hidden">
            {/* Simple Dot Pattern Background */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
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
                        {t.secretTitle} - Spain Surveillance Matrix
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-6 pt-4"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-primary">{data.reduce((acc, mu) => acc + mu.members.length, 0)}</span>
                            <span className="text-[10px] text-foreground/40 font-mono uppercase tracking-widest italic font-bold">{t.compatriotsLabel}</span>
                        </div>
                        <div className="w-px h-8 bg-border/40" />
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-primary">{data.length}</span>
                            <span className="text-[10px] text-foreground/40 font-mono uppercase tracking-widest italic font-bold">{t.unitsLabel}</span>
                        </div>
                    </motion.div>
                </header>

                <AuthGate>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 rounded-3xl bg-secondary/20 animate-pulse border border-border/20" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                            {data.map((mu, index) => (
                                <motion.div
                                    key={mu.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <MUCard mu={mu} language={language} />
                                </motion.div>
                            ))}
                        </div>
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
        <div className="bg-secondary/10 backdrop-blur-md rounded-[2rem] border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden flex flex-col group shadow-xl h-auto self-start">
            {/* Header */}
            <div className="p-8 relative">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full" />

                <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden shadow-lg shadow-primary/10">
                            {mu.avatar ? (
                                <img src={mu.avatar} alt={mu.name} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-8 h-8 text-primary opacity-60" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-none tracking-tight">
                                {mu.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="text-xs font-mono font-bold text-foreground/40 uppercase tracking-widest italic leading-none">
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
                    className="w-full p-4 hover:bg-primary/5 border-t border-border/20 flex items-center justify-center gap-2 group/btn transition-colors"
                >
                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-foreground/40 group-hover/btn:text-primary">
                        {expanded ? 'Retract Data' : 'Expand Agent Manifest'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-foreground/20 group-hover/btn:text-primary transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                    <div className="px-6 pb-8 max-h-[500px] overflow-y-auto space-y-3 custom-scrollbar">
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
    const isReady = member.health > 80 && member.energy > 5;

    return (
        <div className="bg-background/60 border border-border/40 p-5 rounded-3xl group/member hover:border-primary/40 hover:bg-primary/5 transition-all shadow-lg">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-secondary flex-shrink-0 border border-border/50 shadow-inner">
                    {member.avatar ? (
                        <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/40 italic font-black text-xl">
                            ?
                        </div>
                    )}
                </div>

                <div className="flex-grow">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-black text-lg tracking-tight group-hover/member:text-primary transition-colors italic">
                            {member.username}
                        </span>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-foreground/60 font-bold uppercase italic bg-secondary/30 px-2 py-1 rounded-md">
                                {t.level} {member.level}
                            </span>
                            <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500/50'}`} />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Heart className="w-3 h-3 text-red-500" />
                                <span className="text-[8px] font-mono font-bold text-foreground/50 uppercase tracking-[0.05em]">{t.healthStatus}</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-1000 shadow-[0_0_5px_rgba(239,68,68,0.5)]" style={{ width: `${Math.min(member.health, 100)}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-primary" />
                                <span className="text-[8px] font-mono font-bold text-foreground/50 uppercase tracking-[0.05em]">{t.energyStatus}</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-1000 shadow-[0_0_5px_rgba(var(--primary),0.5)]" style={{ width: `${Math.min((member.energy / 100) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Utensils className="w-3 h-3 text-amber-500" />
                                <span className="text-[8px] font-mono font-bold text-foreground/50 uppercase tracking-[0.05em]">{t.hungerStatus}</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_5px_rgba(245,158,11,0.5)]" style={{ width: `${Math.min(member.hunger, 100)}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1.5 text-right">
                            <div className="text-[8px] font-mono font-bold text-foreground/50 uppercase tracking-[0.05em] mb-1">{t.intelRank}</div>
                            <div className="text-sm font-black text-primary leading-none italic">
                                {member.rank}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
