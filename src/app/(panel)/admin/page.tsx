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
import { subMonths, startOfMonth, endOfMonth, formatISO, format } from 'date-fns';
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

  return (
    <div className="space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Panel de Super Administrador</h1>
            <p className="text-muted-foreground">
                Bienvenido al panel de control.
            </p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Próximas Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Aquí se mostrarán estadísticas y herramientas de gestión para administradores.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
