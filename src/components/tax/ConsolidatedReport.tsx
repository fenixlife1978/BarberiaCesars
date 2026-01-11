'use client';
import { useMemo, useState } from 'react';
import { type OperatingExpense, type TaxRecord, expenseCategories, months as monthNames } from '@/types';
import { getYear, parse } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type ConsolidatedReportProps = {
  taxRecords: TaxRecord[];
  operatingExpenses: OperatingExpense[];
};

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const allCategories: ("Impuestos" | (typeof expenseCategories)[number])[] = ["Impuestos", ...expenseCategories];


export default function ConsolidatedReport({ taxRecords, operatingExpenses }: ConsolidatedReportProps) {
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());

  const availableYears = useMemo(() => {
    const years = new Set([
      ...taxRecords.map(r => getYear(parse(r.paymentDate, 'yyyy-MM-dd', new Date()))),
      ...operatingExpenses.map(e => getYear(parse(e.date, 'yyyy-MM-dd', new Date()))),
    ]);
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [taxRecords, operatingExpenses]);
  
  if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
    setSelectedYear(availableYears[0]);
  }

  const monthlyData = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    monthNames.forEach((_, index) => {
      data[index] = {};
      allCategories.forEach(cat => {
        data[index][cat] = 0;
      });
    });

    const year = parseInt(selectedYear);

    taxRecords.forEach(record => {
      const recordDate = parse(record.paymentDate, 'yyyy-MM-dd', new Date());
      if (getYear(recordDate) === year) {
        const monthIndex = recordDate.getMonth();
        data[monthIndex]["Impuestos"] = (data[monthIndex]["Impuestos"] || 0) + record.amountEuros;
      }
    });

    operatingExpenses.forEach(expense => {
      const expenseDate = parse(expense.date, 'yyyy-MM-dd', new Date());
      if (getYear(expenseDate) === year) {
        const monthIndex = expenseDate.getMonth();
        data[monthIndex][expense.category] = (data[monthIndex][expense.category] || 0) + expense.amountEuros;
      }
    });
    
    return data;
  }, [taxRecords, operatingExpenses, selectedYear]);

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    allCategories.forEach(cat => totals[cat] = 0);

    Object.values(monthlyData).forEach(monthData => {
      allCategories.forEach(cat => {
        totals[cat] += monthData[cat] || 0;
      });
    });
    return totals;
  }, [monthlyData]);

  const rowTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(monthlyData).forEach(([monthIndex, monthData]) => {
        totals[monthIndex] = Object.values(monthData).reduce((sum, value) => sum + value, 0);
    });
    return totals;
  }, [monthlyData]);

  const grandTotal = useMemo(() => {
    return Object.values(columnTotals).reduce((sum, value) => sum + value, 0);
  }, [columnTotals]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Reporte Consolidado - ${selectedYear}`, 14, 22);

    const tableColumns = ["Mes", ...allCategories, "Total Mes (€)"];
    const tableRows: any[] = [];

    monthNames.forEach((month, index) => {
        const rowData = [
            month,
            ...allCategories.map(cat => formatCurrency(monthlyData[index][cat] || 0)),
            formatCurrency(rowTotals[index] || 0)
        ];
        tableRows.push(rowData);
    });

    const footerRow = [
        "Totales (€)",
        ...allCategories.map(cat => formatCurrency(columnTotals[cat])),
        formatCurrency(grandTotal)
    ];

    doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        foot: [footerRow],
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
        styles: { fontSize: 8 },
        bodyStyles: { minCellHeight: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`reporte_consolidado_${selectedYear}.pdf`);
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Selecciona un año" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
         <Button onClick={exportToPDF} className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar a PDF
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Mes</TableHead>
              {allCategories.map(cat => (
                <TableHead key={cat} className="text-right">{cat}</TableHead>
              ))}
               <TableHead className="text-right font-bold">Total Mes (€)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthNames.map((month, index) => (
              <TableRow key={month}>
                <TableCell className="font-medium">{month}</TableCell>
                {allCategories.map(cat => (
                  <TableCell key={cat} className="text-right">
                    {formatCurrency(monthlyData[index][cat] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">{formatCurrency(rowTotals[index] || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold text-lg">Totales (€)</TableHead>
              {allCategories.map(cat => (
                <TableHead key={cat} className="text-right font-bold text-lg">
                  {formatCurrency(columnTotals[cat])}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold text-lg">{formatCurrency(grandTotal)}</TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
