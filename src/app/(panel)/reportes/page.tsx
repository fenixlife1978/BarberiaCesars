'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import TaxReport from "@/components/tax/TaxReport";
import ConsolidatedReport from "@/components/tax/ConsolidatedReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperatingExpense, TaxRecord } from '@/types';
import { useAuth } from '@/firebase/provider';

export default function ReportesPage() {
  const { firestore } = initializeFirebase();
  const user = useAuth();

  // TAX RECORDS: Ruta centralizada en default-user
  const taxRecordsRef = useMemo(() => {
    if (!user) return null;
    return collection(firestore, `users/default-user/taxRecords`);
  }, [firestore, user]);

  const taxRecordsQuery = useMemo(() => {
    if (!taxRecordsRef) return null;
    return query(taxRecordsRef, orderBy('paymentDate', 'desc'));
  }, [taxRecordsRef]);

  const { data: taxRecords, isLoading: isLoadingTax } = useCollection<TaxRecord>(taxRecordsQuery);

  // EXPENSES: Ruta centralizada en default-user
  const expensesRef = useMemo(() => {
    if (!user) return null;
    return collection(firestore, `users/default-user/operatingExpenses`);
  }, [firestore, user]);

  const expensesQuery = useMemo(() => {
    if (!expensesRef) return null;
    return query(expensesRef, orderBy('date', 'desc'));
  }, [expensesRef]);

  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<OperatingExpense>(expensesQuery);

  const isLoading = isLoadingTax || isLoadingExpenses;
  
  if (!user) {
    return (
        <div className="space-y-6 p-4">
            <Card className="shadow-lg border-none">
                <CardHeader className="bg-slate-50/50">
                    <CardTitle className="text-2xl font-bold text-primary">Reportes</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                     <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="text-2xl font-bold text-primary">Reportes</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="consolidado">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consolidado">Reporte Consolidado</TabsTrigger>
              <TabsTrigger value="impuestos">Reporte de Impuestos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="consolidado" className="mt-6">
               {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <ConsolidatedReport 
                  taxRecords={taxRecords || []} 
                  operatingExpenses={expenses || []} 
                />
              )}
            </TabsContent>
            
            <TabsContent value="impuestos" className="mt-6">
              {isLoadingTax ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <TaxReport records={taxRecords || []} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
