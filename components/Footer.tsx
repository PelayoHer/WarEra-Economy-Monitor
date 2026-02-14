'use client';

import { Heart, ExternalLink } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface Props {
    language: Language;
}

export default function Footer({ language }: Props) {
    const t = translations[language];
    const profileUrl = 'https://app.warera.io/user/6813b770efecdf9bab196baa';

    return (
        <footer className="mt-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Support Box */}
                <div className="glass-card p-5 border-primary/30 bg-primary/5">
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2">
                            <Heart className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {language === 'es' ? '¿Te ha sido útil?' : 'Found it useful?'}
                            </h3>
                        </div>

                        <p className="text-sm text-foreground/80">
                            {t.footerDonation}{' '}
                            <a
                                href={profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1 font-semibold transition-smooth"
                            >
                                {t.footerDonationLink}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>{' '}
                            {t.footerMessage}
                        </p>
                    </div>
                </div>

                {/* Creator Credit */}
                <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/30">
                        <span className="text-sm font-semibold text-foreground/80">
                            {language === 'es' ? 'Hecho por' : 'Made by'}
                        </span>
                        <span className="text-sm font-bold text-primary">
                            PelayoHer
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
