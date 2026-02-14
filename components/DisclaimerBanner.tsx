'use client';

import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { translations, Language } from '@/lib/i18n';

interface Props {
    language: Language;
}

export default function DisclaimerBanner({ language }: Props) {
    const [isDismissed, setIsDismissed] = useLocalStorage('disclaimer-dismissed', false);
    const t = translations[language];

    if (isDismissed) {
        return null;
    }

    return (
        <div className="glass-card p-4 border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1">{t.disclaimerTitle}</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        {t.disclaimerMessage.split('**').map((part, i) =>
                            i % 2 === 1 ? <strong key={i} className="text-primary">{part}</strong> : part
                        )}
                    </p>
                </div>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1 hover:bg-secondary/30 rounded transition-smooth"
                    aria-label="Dismiss"
                >
                    <X className="w-5 h-5 text-foreground/60 hover:text-foreground" />
                </button>
            </div>
        </div>
    );
}
