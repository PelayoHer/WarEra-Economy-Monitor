'use client';

import { Languages } from 'lucide-react';
import { Language } from '@/lib/i18n';

interface Props {
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

export default function LanguageToggle({ language, onLanguageChange }: Props) {
    const toggleLanguage = () => {
        onLanguageChange(language === 'es' ? 'en' : 'es');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="glass-card px-4 py-2 glow-hover transition-smooth flex items-center gap-2 hover:border-primary/50"
            aria-label="Toggle language"
        >
            <Languages className="w-5 h-5" />
            <span className="font-medium">{language.toUpperCase()}</span>
        </button>
    );
}
