
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltipContent } from '@/components/ui/chart';
import { type TaxRecord } from '@/types';
import { subMonths, format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

type TaxChartProps = {
  records: TaxRecord[];
};

export default function TaxChart({ records }: TaxChartProps) {
  const chartData = useMemo(() => {
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const monthlyTotals: { [key: string]: number } = {};

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const month = format(subMonths(new Date(), i), 'yyyy-MM');
      monthlyTotals[month] = 0;
    }

    records.forEach((record) => {
      const recordDate = new Date(record.paymentDate);
      if (recordDate >= sixMonthsAgo) {
        const monthKey = format(recordDate, 'yyyy-MM');
        if (monthlyTotals[monthKey] !== undefined) {
          monthlyTotals[monthKey] += record.amountEuros;
        }
      }
    });

    return Object.keys(monthlyTotals)
      .map((month) => ({
        month: format(new Date(`${month}-01T12:00:00`), 'MMM yyyy', { locale: es }),
        total: monthlyTotals[month],
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  }, [records]);

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => `€${value}`}
           />
          <Tooltip 
             cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
             content={<ChartTooltipContent
                formatter={(value) => `€${Number(value).toFixed(2)}`}
                labelClassName="font-bold"
                indicator='dot'
             />}
           />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
