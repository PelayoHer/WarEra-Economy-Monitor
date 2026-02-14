'use client';

import { X, HelpCircle, BookOpen, Brain, ShieldAlert } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

export default function HelpModal({ isOpen, onClose, language }: Props) {
    if (!isOpen) return null;

    const t = translations[language];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="glass-card w-full max-w-lg p-6 relative shadow-2xl border-primary/20 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-foreground/50" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                        {t.helpTitle}
                    </h2>
                </div>

                <div className="space-y-6">
                    <section className="space-y-2">
                        <h3 className="flex items-center gap-2 font-bold text-primary">
                            <BookOpen className="w-4 h-4" />
                            {t.helpRule1Title}
                        </h3>
                        <p className="text-sm text-foreground/70 leading-relaxed pl-6 italic">
                            {t.helpRule1Text}
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="flex items-center gap-2 font-bold text-success">
                            <Brain className="w-4 h-4" />
                            {t.helpRule2Title}
                        </h3>
                        <p className="text-sm text-foreground/70 leading-relaxed pl-6 italic">
                            {t.helpRule2Text}
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="flex items-center gap-2 font-bold text-danger">
                            <ShieldAlert className="w-4 h-4" />
                            {t.helpRule3Title}
                        </h3>
                        <p className="text-sm text-foreground/70 leading-relaxed pl-6 italic">
                            {t.helpRule3Text}
                        </p>
                    </section>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                    {t.close}
                </button>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
