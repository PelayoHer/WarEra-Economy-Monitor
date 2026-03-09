'use client';

import React, { useState, useEffect } from 'react';
import { translations, Language } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';

interface AuthGateProps {
    children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
    const [language] = useLocalStorage<Language>('language', 'es');
    const [password, setPassword] = useLocalStorage<string>('intel_pass', '');
    const [inputValue, setInputValue] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState(false);

    const t = translations[language];

    const SECRET_KEY = 'Amañado';

    useEffect(() => {
        if (password === SECRET_KEY) {
            setIsAuthorized(true);
        }
    }, [password]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue === SECRET_KEY) {
            setPassword(SECRET_KEY);
            setIsAuthorized(true);
            setError(false);
        } else {
            setError(true);
            setInputValue('');
        }
    };

    if (isAuthorized) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <div className="w-full max-w-md bg-secondary/30 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                {/* Glow effect */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors" />

                <div className="relative z-10 text-center space-y-6">
                    <div className="inline-flex p-4 rounded-full bg-primary/10 border border-primary/20 animate-pulse">
                        <ShieldAlert className="w-12 h-12 text-primary" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">{t.accessDenied}</h2>
                        <p className="text-foreground/60 text-sm">
                            {t.enterPassword}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                            <input
                                type="password"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className={`w-full bg-background/50 border ${error ? 'border-red-500' : 'border-border/50'} rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                                placeholder="••••••••"
                                autoComplete="off"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group/btn"
                        >
                            <Lock className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            Decrypt
                        </button>
                    </form>

                    {error && (
                        <p className="text-red-500 text-sm font-medium animate-bounce">
                            Authentication failed. IP Logged.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
