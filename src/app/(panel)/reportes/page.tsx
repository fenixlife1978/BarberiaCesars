'use client';
import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import { useAuth, useUserRole } from '@/firebase/provider';
import TaxReport from "@/components/tax/TaxReport";
import ConsolidatedReport from "@/components/tax/ConsolidatedReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperatingExpense, TaxRecord } from '@/types';

export default function ReportesPage() {
  const user = useAuth();
  const userRole = useUserRole();
  const { firestore } = initializeFirebase();

  const userIdToQuery = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);

  // Fetch Tax Records
  const taxRecordsRef = useMemo(() => {
    if (!userIdToQuery) return null;
    return collection(firestore, `users/${userIdToQuery}/taxRecords`);
  }, [userIdToQuery, firestore]);
  const taxRecordsQuery = useMemo(() => {
    if (!taxRecordsRef) return null;
    return query(taxRecordsRef, orderBy('paymentDate', 'desc'));
  }, [taxRecordsRef]);
  const { data: taxRecords, isLoading: isLoadingTax } = useCollection<TaxRecord>(taxRecordsQuery);

  // Fetch Operating Expenses
  const expensesRef = useMemo(() => {
    if (!userIdToQuery) return null;
    return collection(firestore, `users/${userIdToQuery}/operatingExpenses`);
  }, [userIdToQuery, firestore]);
  const expensesQuery = useMemo(() => {
    if (!expensesRef) return null;
    return query(expensesRef, orderBy('date', 'desc'));
  }, [expensesRef]);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<OperatingExpense>(expensesQuery);

  const isLoading = isLoadingTax || isLoadingExpenses;

  return (
    <div className="space-y-6">
       <div className="flex justify-start">
        <BackButton />
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Reportes</CardTitle>
        </CardHeader>
        <CardContent>
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
