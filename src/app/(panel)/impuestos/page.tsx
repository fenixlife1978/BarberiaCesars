'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ReceiptText, History, BarChart2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";
import TaxForm from "@/components/tax/TaxForm";
import TaxTable from "@/components/tax/TaxTable";
import { useAuth } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { OperatingExpense, TaxRecord } from '@/types';
import ExpensesChart from '@/components/tax/ExpensesChart';

export default function ImpuestosPage() {
  const { firestore } = initializeFirebase();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const user = useAuth();

  const taxQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/default-user/taxRecords`),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const expensesQuery = useMemo(() => {
    if (!user) return null;
    return query(
        collection(firestore, 'users/default-user/operatingExpenses'),
        orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: records, isLoading: isLoadingTaxes } = useCollection<TaxRecord>(taxQuery);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<OperatingExpense>(expensesQuery);
  
  const isLoading = isLoadingTaxes || isLoadingExpenses;

  if (!user) {
    return (
        <div className="space-y-6 p-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <BackButton />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Registrar Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Registro de Impuesto</DialogTitle>
            </DialogHeader>
            <TaxForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <ReceiptText className="h-6 w-6 text-primary" /> Gestión Central de Impuestos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="historial" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <History className="h-4 w-4" /> Historial
              </TabsTrigger>
              <TabsTrigger value="resumen" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" /> Estadísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="historial">
              <TaxTable records={records || []} isLoading={isLoadingTaxes} />
            </TabsContent>

            <TabsContent value="resumen">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                         <Skeleton className="h-full w-full" />
                    </div>
                ) : (
                    <ExpensesChart taxRecords={records || []} operatingExpenses={expenses || []} />
                )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
