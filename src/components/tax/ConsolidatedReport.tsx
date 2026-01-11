'use client';
import { useMemo, useState } from 'react';
import { type OperatingExpense, type TaxRecord, expenseCategories, months as monthNames } from '@/types';
import { getYear, parse } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ConsolidatedReportProps = {
  taxRecords: TaxRecord[];
  operatingExpenses: OperatingExpense[];
};

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
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecciona un año" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Mes</TableHead>
              {allCategories.map(cat => (
                <TableHead key={cat} className="text-right">{cat}</TableHead>
              ))}
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
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
