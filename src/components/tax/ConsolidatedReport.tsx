'use client';
import { useMemo, useState } from 'react';
import { type OperatingExpense, type TaxRecord, expenseCategories, months as monthNames, Settings } from '@/types';
import { getYear, parse, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth, useUserRole } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

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
  const user = useAuth();
  const userRole = useUserRole();
  const { firestore } = initializeFirebase();

  const userIdToQuery = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);

  const settingsRef = useMemo(() => {
    if (!userIdToQuery) return null;
    return doc(firestore, `users/${userIdToQuery}/settings/general`);
  }, [userIdToQuery, firestore]);

  const { data: settings } = useDoc<Settings>(settingsRef);
  const companyName = settings?.companyName || 'Mi Empresa';
  const logoUrl = settings?.logoUrl;


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

  const addHeaderToPDF = (doc: jsPDF, title: string) => {
    const emissionDate = format(new Date(), "d MMM yyyy, HH:mm:ss", { locale: es });
    
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = logoUrl;
        // This is a hacky way to make sure the image is loaded before adding it to the PDF.
        // A better solution would involve handling image loading async.
        doc.addImage(logoUrl, 'PNG', 14, 12, 20, 20);
      } catch (e) {
        console.error("Error loading logo for PDF", e);
      }
    }
    
    doc.setFontSize(18);
    doc.text(companyName, logoUrl ? 40 : 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${title}`, logoUrl ? 40 : 14, 28);
    doc.text(`Emitido: ${emissionDate}`, doc.internal.pageSize.getWidth() - 14, 28, { align: 'right' });
  };


  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const reportTitle = `Reporte Consolidado - ${selectedYear}`;
    addHeaderToPDF(doc, reportTitle);

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
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [0, 98, 65], textColor: 255 }, // Dark Green from theme
        footStyles: { fillColor: [241, 230, 210], textColor: 0, fontStyle: 'bold' }, // Cream background from theme
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

      <div className="rounded-md border overflow-x-auto">
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
                <TableCell className="font-medium whitespace-nowrap">{month}</TableCell>
                {allCategories.map(cat => (
                  <TableCell key={cat} className="text-right whitespace-nowrap">
                    {formatCurrency(monthlyData[index][cat] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(rowTotals[index] || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold text-lg">Totales (€)</TableHead>
              {allCategories.map(cat => (
                <TableHead key={cat} className="text-right font-bold text-lg whitespace-nowrap">
                  {formatCurrency(columnTotals[cat])}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold text-lg whitespace-nowrap">{formatCurrency(grandTotal)}</TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
