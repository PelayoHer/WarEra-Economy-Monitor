'use client';

import { Download, FileText } from 'lucide-react';
import { ProfitabilityData } from '@/types';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { translations, Language } from '@/lib/i18n';

interface Props {
    data: ProfitabilityData[];
    language: Language;
}

export default function ExportButtons({ data, language }: Props) {
    const t = translations[language];

    const handleExportCSV = () => {
        exportToCSV(data);
    };

    const handleExportPDF = () => {
        exportToPDF(data);
    };

    if (data.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-3 justify-center">
            <button
                onClick={handleExportCSV}
                className="glass-card px-4 py-2 glow-hover transition-smooth flex items-center gap-2 hover:border-success/50 hover:scale-105"
            >
                <Download className="w-5 h-5 text-success" />
                <span>{t.exportCSV}</span>
            </button>

            <button
                onClick={handleExportPDF}
                className="glass-card px-4 py-2 glow-hover transition-smooth flex items-center gap-2 hover:border-danger/50 hover:scale-105"
            >
                <FileText className="w-5 h-5 text-danger" />
                <span>{t.exportPDF}</span>
            </button>
        </div>
    );
}
