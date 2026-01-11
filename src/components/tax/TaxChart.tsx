
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { type TaxRecord } from '@/types';
import { subMonths, format, startOfMonth, parse } from 'date-fns';
import { es } from 'date-fns/locale';

type TaxChartProps = {
  records: TaxRecord[];
};

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--primary))",
  },
};

export default function TaxChart({ records }: TaxChartProps) {
  const chartData = useMemo(() => {
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const monthlyTotals: { [key: string]: number } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(new Date(), i), 'yyyy-MM');
      monthlyTotals[month] = 0;
    }

    records.forEach((record) => {
      // Ensure paymentDate is treated as local time by adding a time component
      const recordDate = new Date(record.paymentDate + 'T00:00:00');
      if (recordDate >= sixMonthsAgo) {
        const monthKey = format(recordDate, 'yyyy-MM');
        if (monthlyTotals.hasOwnProperty(monthKey)) {
          monthlyTotals[monthKey] += record.amountEuros;
        }
      }
    });

    return Object.keys(monthlyTotals)
      .map((monthKey) => ({
        // Use a full date for sorting, and a formatted string for display
        date: parse(monthKey, 'yyyy-MM', new Date()),
        month: format(parse(monthKey, 'yyyy-MM', new Date()), 'MMM yy', { locale: es }),
        total: monthlyTotals[monthKey],
      }))
      // Sort by the full date object
      .sort((a, b) => a.date.getTime() - b.date.getTime());

  }, [records]);

  return (
    <div className="h-[250px] w-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} accessibilityLayer>
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
            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
