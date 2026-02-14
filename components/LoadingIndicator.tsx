'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingIndicator() {
    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-foreground/80">Actualizando precios del mercado...</p>
            </div>
        </div>
    );
}
