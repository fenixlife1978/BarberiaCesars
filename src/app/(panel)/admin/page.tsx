'use client';

import { useMemo, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import { useUserRole } from '@/firebase/provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, DollarSign, Landmark, Wrench, Receipt } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TaxRecord, OperatingExpense } from '@/types';

function StatCard({ title, value, icon: Icon, isLoading }: { title: string; value: string; icon: React.ElementType; isLoading: boolean }) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold text-primary">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}


export default function AdminPage() {
  const userRole = useUserRole();
  const { firestore } = initializeFirebase();

  // --- Lógica de fechas para el mes anterior ---
  const { prevMonthStart, prevMonthEnd } = useMemo(() => {
    const now = new Date();
    const prevMonth = subMonths(now, 1);
    return {
      prevMonthStart: formatISO(startOfMonth(prevMonth), { representation: 'date' }),
      prevMonthEnd: formatISO(endOfMonth(prevMonth), { representation: 'date' }),
    };
  }, []);

  // --- Consultas a Firestore para el mes anterior ---
  const taxQuery = useMemo(() => {
    return query(
      collection(firestore, 'users/default-user/taxRecords'),
      where('paymentDate', '>=', prevMonthStart),
      where('paymentDate', '<=', prevMonthEnd)
    );
  }, [firestore, prevMonthStart, prevMonthEnd]);

  const expensesQuery = useMemo(() => {
    return query(
      collection(firestore, 'users/default-user/operatingExpenses'),
      where('date', '>=', prevMonthStart),
      where('date', '<=', prevMonthEnd)
    );
  }, [firestore, prevMonthStart, prevMonthEnd]);

  const { data: taxRecords, isLoading: isLoadingTaxes } = useCollection<TaxRecord>(taxQuery);
  const { data: operatingExpenses, isLoading: isLoadingExpenses } = useCollection<OperatingExpense>(expensesQuery);

  const isLoading = isLoadingTaxes || isLoadingExpenses;

  // --- Cálculos de las métricas ---
  const metrics = useMemo(() => {
    const taxTotal = taxRecords?.reduce((sum, rec) => sum + rec.amountEuros, 0) || 0;
    const basicServicesTotal = operatingExpenses?.filter(exp => exp.category === 'Gastos Básicos').reduce((sum, exp) => sum + exp.amountEuros, 0) || 0;
    const otherExpensesTotal = operatingExpenses?.filter(exp => exp.category === 'Otros Gastos').reduce((sum, exp) => sum + exp.amountEuros, 0) || 0;
    const totalExpenses = taxTotal + basicServicesTotal + otherExpensesTotal;

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

    return {
      total: formatCurrency(totalExpenses),
      taxes: formatCurrency(taxTotal),
      basicServices: formatCurrency(basicServicesTotal),
      others: formatCurrency(otherExpensesTotal),
    };
  }, [taxRecords, operatingExpenses]);
  

  useEffect(() => {
    if (userRole !== null && userRole !== 'super_admin') {
      redirect('/impuestos');
    }
  }, [userRole]);

  if (userRole !== 'super_admin') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const prevMonthName = format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: es });

  return (
    <div className="space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Panel de Super Administrador</h1>
            <p className="text-muted-foreground">
                Resumen financiero para <span className="font-semibold capitalize">{prevMonthName}</span>
            </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Gastos" value={metrics.total} icon={DollarSign} isLoading={isLoading} />
            <StatCard title="Gastos de Impuestos" value={metrics.taxes} icon={Landmark} isLoading={isLoading} />
            <StatCard title="Gastos Servicios Básicos" value={metrics.basicServices} icon={Receipt} isLoading={isLoading} />
            <StatCard title="Otros Gastos" value={metrics.others} icon={Wrench} isLoading={isLoading} />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Análisis detallado</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Próximamente: gráficos y tablas detalladas del rendimiento mensual.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
