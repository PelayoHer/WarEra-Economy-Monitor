import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProfitabilityData } from '@/types';
import { formatPrice } from './calculator';

export function exportToCSV(data: ProfitabilityData[], filename: string = 'warera-economy-data.csv') {
    // CSV headers
    const headers = ['Rank', 'Product', 'Market Price', 'Production Cost', 'Net Profit', 'Profit Margin %'];

    // CSV rows
    const rows = data.map((item, index) => [
        index + 1,
        item.recipe.name,
        formatPrice(item.marketPrice),
        formatPrice(item.productionCost),
        formatPrice(item.netProfit),
        formatPrice(item.profitMargin, 1),
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportToPDF(data: ProfitabilityData[], filename: string = 'warera-economy-report.pdf') {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('WarEra Market Analytics', 14, 20);

    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Profitability Report', 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    // Reset color
    doc.setTextColor(0);

    // Table data
    const tableData = data.map((item, index) => [
        index + 1,
        item.recipe.name,
        formatPrice(item.marketPrice),
        formatPrice(item.productionCost),
        formatPrice(item.netProfit),
        formatPrice(item.profitMargin, 1) + '%',
    ]);

    // Generate table
    autoTable(doc, {
        startY: 40,
        head: [['#', 'Product', 'Market Price', 'Production Cost', 'Net Profit', 'Margin %']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [59, 130, 246], // Primary blue
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
        },
        bodyStyles: {
            fontSize: 9,
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 25, halign: 'right' },
        },
        didParseCell: (data) => {
            // Color code net profit column
            if (data.column.index === 4 && data.section === 'body') {
                const cellValue = tableData[data.row.index][4];
                const profitValue = parseFloat(String(cellValue).replace(/[^\d.-]/g, ''));
                if (profitValue > 0) {
                    data.cell.styles.textColor = [22, 163, 74]; // Green
                } else if (profitValue < 0) {
                    data.cell.styles.textColor = [239, 68, 68]; // Red
                }
            }
        },
    });

    // Footer with page numbers and creator credit
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Page number
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );

        // Creator credit
        doc.setFontSize(9);
        doc.setTextColor(59, 130, 246); // Primary blue
        doc.text(
            'Hecho por PelayoHer',
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
        );
    }

    // Save
    doc.save(filename);
}
