'use client';

import { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { type TaxRecord, type OperatingExpense } from '@/types';
import { subMonths, format, startOfMonth, parse, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

type ExpensesChartProps = {
  taxRecords: TaxRecord[];
  operatingExpenses: OperatingExpense[];
};

const chartConfig = {
  Impuestos: {
    label: "Impuestos (€)",
    color: "hsl(var(--chart-1))",
  },
  'Gastos Básicos': {
    label: "Gastos Básicos (€)",
    color: "hsl(var(--chart-2))",
  },
  'Otros Gastos': {
    label: "Otros Gastos (€)",
    color: "hsl(var(--chart-3))",
  },
};

const ExpensesChart = forwardRef((props: ExpensesChartProps, ref) => {
  const { taxRecords, operatingExpenses } = props;
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    const today = new Date();
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(today, i);
        return {
            monthKey: format(d, 'yyyy-MM'),
            monthLabel: format(d, 'MMM yy', { locale: es }),
            interval: { start: startOfMonth(d), end: endOfMonth(d) }
        };
    }).reverse();

    const monthlyTotals: { 
        month: string; 
        Impuestos: number; 
        'Gastos Básicos': number; 
        'Otros Gastos': number; 
    }[] = last6Months.map(m => ({ 
        month: m.monthLabel.charAt(0).toUpperCase() + m.monthLabel.slice(1), 
        Impuestos: 0, 
        'Gastos Básicos': 0,
        'Otros Gastos': 0
    }));

    taxRecords.forEach((record) => {
      const recordDate = parse(record.paymentDate, 'yyyy-MM-dd', new Date());
      const monthIndex = last6Months.findIndex(m => isWithinInterval(recordDate, m.interval));
      if (monthIndex !== -1) {
        monthlyTotals[monthIndex].Impuestos += record.amountEuros;
      }
    });

    operatingExpenses.forEach((expense) => {
        const expenseDate = parse(expense.date, 'yyyy-MM-dd', new Date());
        const monthIndex = last6Months.findIndex(m => isWithinInterval(expenseDate, m.interval));
        if (monthIndex !== -1) {
            if (expense.category === 'Gastos Básicos') {
                monthlyTotals[monthIndex]['Gastos Básicos'] += expense.amountEuros;
            } else if (expense.category === 'Otros Gastos') {
                monthlyTotals[monthIndex]['Otros Gastos'] += expense.amountEuros;
            }
        }
    });

    return monthlyTotals.map(monthData => ({
        ...monthData,
        Impuestos: parseFloat(monthData.Impuestos.toFixed(2)),
        'Gastos Básicos': parseFloat(monthData['Gastos Básicos'].toFixed(2)),
        'Otros Gastos': parseFloat(monthData['Otros Gastos'].toFixed(2)),
    }));

  }, [taxRecords, operatingExpenses]);
  
  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  const handleExportPDF = async () => {
    if (!chartContainerRef.current) return;

    try {
        const dataUrl = await toPng(chartContainerRef.current, { cacheBust: true });
        const pdf = new jsPDF('landscape');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.setFontSize(16);
        pdf.text('Reporte de Gastos - Últimos 6 Meses', pdfWidth / 2, 15, { align: 'center' });

        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * pdfWidth * 0.9) / imgProps.width;
        
        pdf.addImage(dataUrl, 'PNG', pdfWidth * 0.05, 25, pdfWidth * 0.9, imgHeight);

        let finalY = 25 + imgHeight + 10;
        if (finalY > pdfHeight - 20) {
            pdf.addPage();
            finalY = 20;
        }

        (pdf as any).autoTable({
            startY: finalY,
            head: [['Mes', 'Impuestos (€)', 'Gastos Básicos (€)', 'Otros Gastos (€)']],
            body: chartData.map(d => [d.month, formatCurrency(d.Impuestos), formatCurrency(d['Gastos Básicos']), formatCurrency(d['Otros Gastos'])]),
            theme: 'striped',
            headStyles: { fillColor: [0, 98, 65] },
        });

        pdf.save('reporte-gastos-ultimos-6-meses.pdf');
    } catch (error) {
        console.error('oops, something went wrong!', error);
    }
  };
  
  useImperativeHandle(ref, () => ({
    exportToPDF: handleExportPDF,
  }));

  return (
    <div className='space-y-4'>
        <div className="flex justify-end">
            <Button onClick={handleExportPDF}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar a PDF
            </Button>
        </div>
        <div ref={chartContainerRef} className="h-[400px] w-full p-4 bg-card rounded-xl shadow-inner border border-border/50">
        <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `€${value}`}
                />
                <Tooltip 
                    cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                    content={<ChartTooltipContent
                        formatter={formatCurrency}
                        labelClassName="font-bold text-lg"
                        indicator='dot'
                    />}
                />
                <Legend verticalAlign="top" align="center" wrapperStyle={{paddingBottom: '20px'}}/>
                <Bar dataKey="Impuestos" stackId="a" fill="var(--color-Impuestos)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos Básicos" stackId="a" fill="var(--color-Gastos Básicos)" />
                <Bar dataKey="Otros Gastos" stackId="a" fill="var(--color-Otros Gastos)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
        </div>
    </div>
  );
});

ExpensesChart.displayName = "ExpensesChart";

export default ExpensesChart;
