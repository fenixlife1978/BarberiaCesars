'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import EconomicLicensesTable from "@/components/license/EconomicLicensesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { Skeleton } from '@/components/ui/skeleton';
import { EconomicLicense } from '@/types';
import { useAuth, useUserRole } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EconomicLicenseForm from '@/components/license/EconomicLicenseForm';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function LicenciasPage() {
  const { firestore } = initializeFirebase();
  const user = useAuth();
  const userRole = useUserRole();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const licensesQuery = useMemo(() => {
    if (!user) return null;
    const userId = userRole === 'super_admin' ? 'default-user' : user.uid;
    return query(
      collection(firestore, `users/${userId}/economicLicenses`),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user, userRole]);

  const { data: licenses, isLoading } = useCollection<EconomicLicense>(licensesQuery);

  if (!user) return null;

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <BackButton />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Licencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Licencia Económica</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[75vh] pr-4">
              <EconomicLicenseForm onSuccess={() => setIsFormOpen(false)} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-xl border-none overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-2xl font-bold text-primary">
            Base Central de Licencias Económicas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualización y gestión de expedientes municipales
          </p>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {isLoading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : (
            <div className="p-4 md:p-0">
               <EconomicLicensesTable records={licenses || []} isLoading={isLoading} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
