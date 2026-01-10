
'use client';

import { useState, useMemo } from 'react';
import { type TaxRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, FilterX } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { months } from '@/types';


type TaxReportProps = {
  records: TaxRecord[];
};

export default function TaxReport({ records }: TaxReportProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }

  const availableYears = useMemo(() => {
    const years = new Set(records.map(r => getYear(new Date(r.paymentDate + 'T00:00:00'))));
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  const getConsolidatedPeriod = (settledMonths: string[]): string => {
    if (!settledMonths || settledMonths.length === 0) {
      return 'N/A';
    }

    const sortedMonths = settledMonths.sort((a, b) => {
      const [monthA, yearA] = a.split('-');
      const [monthB, yearB] = b.split('-');
      
      const dateA = new Date(parseInt(yearA), months.indexOf(monthA));
      const dateB = new Date(parseInt(yearB), months.indexOf(monthB));
      
      return dateA.getTime() - dateB.getTime();
    });

    const firstMonth = sortedMonths[0];
    const lastMonth = sortedMonths[sortedMonths.length - 1];

    if (firstMonth === lastMonth) {
      return firstMonth;
    }

    return `${firstMonth} - ${lastMonth}`;
  };


  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
        const recordDate = new Date(record.paymentDate + 'T00:00:00');
        
        const inDateRange = !dateRange || (
            (!dateRange.from || recordDate >= dateRange.from) &&
            (!dateRange.to || recordDate <= dateRange.to)
        );

        const inYear = selectedYear === 'all' || getYear(recordDate) === parseInt(selectedYear);

        return inDateRange && inYear;
    }).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [records, dateRange, selectedYear]);

  const totals = useMemo(() => {
    return filteredRecords.reduce((acc, record) => {
        acc.euros += record.amountEuros;
        acc.bolivares += record.amountBolivares;
        return acc;
    }, { euros: 0, bolivares: 0 });
  }, [filteredRecords]);

  const clearFilters = () => {
    setDateRange(undefined);
    setSelectedYear('all');
  };

  const formatDate = (date: Date) => {
    return format(date, 'd MMM yyyy', { locale: es });
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Popover>
            <PopoverTrigger asChild>
                <Button
                id="date"
                variant={"outline"}
                className={cn(
                    "w-full md:w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                    dateRange.to ? (
                    <>
                        {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                    </>
                    ) : (
                    `Desde ${formatDate(dateRange.from)}`
                    )
                ) : (
                    <span>Selecciona un rango de fechas</span>
                )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={es}
                />
            </PopoverContent>
        </Popover>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Selecciona un año" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
            </SelectContent>
        </Select>

        <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
          <FilterX className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      </div>

      {/* Results */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Nro. Recibo</TableHead>
              <TableHead>Periodo Cancelado</TableHead>
              <TableHead className="text-right">Monto (Bs.)</TableHead>
              <TableHead className="text-right">Tasa BCV</TableHead>
              <TableHead className="text-right">Monto (€)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className='whitespace-nowrap'>{formatDate(new Date(record.paymentDate + 'T00:00:00'))}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.receiptNumber}</TableCell>
                  <TableCell className='whitespace-nowrap'>{getConsolidatedPeriod(record.settledMonths)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(record.amountBolivares)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(record.bcvRate)}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(record.amountEuros)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron registros para los filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow className='bg-muted/50'>
                <TableCell colSpan={4} className="text-right font-bold text-lg">Totales</TableCell>
                <TableCell className="text-right font-bold text-lg whitespace-nowrap">{formatCurrency(totals.bolivares)}</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold text-lg whitespace-nowrap">{formatCurrency(totals.euros)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
