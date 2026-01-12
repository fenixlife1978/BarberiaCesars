'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ReceiptText, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";
import TaxForm from "@/components/tax/TaxForm";
import TaxTable from "@/components/tax/TaxTable";
import { useAuth } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function ImpuestosPage() {
  const { firestore } = initializeFirebase();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const user = useAuth();

  // CONSULTA CENTRALIZADA CORREGIDA A: default-user
  const taxQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/default-user/taxRecords`),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: records, isLoading } = useCollection<any>(taxQuery);

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
              <TabsTrigger value="resumen">Estadísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="historial">
              <TaxTable records={records || []} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="resumen">
                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                    Panel de estadísticas en desarrollo.
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
