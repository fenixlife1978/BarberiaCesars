'use client';
import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/firebase/provider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OperatingExpenseForm from "@/components/expense/OperatingExpenseForm";
import OperatingExpensesTable from "@/components/expense/OperatingExpensesTable";

export default function OperatingExpensesPage() {
  const user = useAuth();
  const { firestore } = initializeFirebase();

  const expensesRef = useMemo(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/operatingExpenses`);
  }, [user, firestore]);
  
  const expensesQuery = useMemo(() => {
    if (!expensesRef) return null;
    return query(expensesRef, orderBy('date', 'desc'));
  }, [expensesRef]);

  const { data: initialExpenses, isLoading } = useCollection(expensesQuery);

  return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Registrar Nuevo Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <OperatingExpenseForm />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 shadow-lg">
           <CardHeader>
            <CardTitle className="text-2xl font-headline">Historial de Gastos de Operación</CardTitle>
          </CardHeader>
          <CardContent>
            <OperatingExpensesTable initialExpenses={initialExpenses || []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
  );
}
