'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { translations, Language } from '@/lib/i18n';
import { BarChart3, Hammer, Coins, Building2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LanguageToggle from '@/components/LanguageToggle';

export default function Navbar() {
    const pathname = usePathname();
    const [language, setLanguage] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="font-bold text-xl tracking-tight text-primary hover:opacity-80 transition-opacity">
                            WarEra Analytics
                        </Link>

                        <div className="hidden md:flex space-x-4">
                            <Link
                                href="/"
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                {t.navHome}
                            </Link>

                            <Link
                                href="/market"
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/market')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <Coins className="w-4 h-4" />
                                {t.navMarket}
                            </Link>

                            <Link
                                href="/production"
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/production')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <Hammer className="w-4 h-4" />
                                {t.navProduction}
                            </Link>
                            <Link
                                href="/playground"
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/playground')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <Building2 className="w-4 h-4" />
                                {t.navPlayground}
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button - simplified */}
                        <div className="md:hidden flex space-x-2">
                            <Link
                                href="/"
                                className={`p-2 rounded-md ${isActive('/') ? 'text-primary bg-primary/10' : 'text-foreground/70'}`}
                            >
                                <BarChart3 className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/market"
                                className={`p-2 rounded-md ${isActive('/market') ? 'text-primary bg-primary/10' : 'text-foreground/70'}`}
                            >
                                <Coins className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/production"
                                className={`p-2 rounded-md ${isActive('/production') ? 'text-primary bg-primary/10' : 'text-foreground/70'}`}
                            >
                                <Hammer className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/playground"
                                className={`p-2 rounded-md ${isActive('/playground') ? 'text-primary bg-primary/10' : 'text-foreground/70'}`}
                            >
                                <Building2 className="w-5 h-5" />
                            </Link>
                        </div>

                        <LanguageToggle language={language} onLanguageChange={setLanguage} />
                    </div>
                </div>
            </div>
        </nav>
    );
}
