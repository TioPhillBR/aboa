import { useCallback } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportOptions {
  filename: string;
  title?: string;
}

export function useExport() {
  const exportToCSV = useCallback((data: Record<string, unknown>[], options: ExportOptions) => {
    try {
      if (!data.length) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return String(value);
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${options.filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('CSV exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar CSV');
      console.error(error);
    }
  }, []);

  const exportToExcel = useCallback((data: Record<string, unknown>[], options: ExportOptions) => {
    try {
      if (!data.length) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, options.title || 'Dados');
      
      XLSX.writeFile(workbook, `${options.filename}.xlsx`);
      toast.success('Excel exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar Excel');
      console.error(error);
    }
  }, []);

  const exportToPDF = useCallback((
    data: Record<string, unknown>[],
    columns: { header: string; key: string }[],
    options: ExportOptions
  ) => {
    try {
      if (!data.length) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(options.title || options.filename, 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

      // Prepare table data
      const headers = columns.map(col => col.header);
      const rows = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return '';
          return String(value);
        })
      );

      // Add table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`${options.filename}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar PDF');
      console.error(error);
    }
  }, []);

  return {
    exportToCSV,
    exportToExcel,
    exportToPDF,
  };
}
