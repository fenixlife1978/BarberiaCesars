'use client';
import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/firebase/provider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EconomicLicenseForm from "@/components/license/EconomicLicenseForm";
import EconomicLicensesTable from "@/components/license/EconomicLicensesTable";

export default function EconomicLicensesPage() {
  const user = useAuth();
  const { firestore } = initializeFirebase();

  const licensesRef = useMemo(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/economicLicenses`);
  }, [user, firestore]);
  
  const licensesQuery = useMemo(() => {
    if (!licensesRef) return null;
    return query(licensesRef, orderBy('issueDate', 'desc'));
  }, [licensesRef]);

  const { data: initialLicenses, isLoading } = useCollection(licensesQuery);


  return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Registrar Nueva Licencia Económica</CardTitle>
          </CardHeader>
          <CardContent>
            <EconomicLicenseForm />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 shadow-lg">
           <CardHeader>
            <CardTitle className="text-2xl font-headline">Historial de Licencias</CardTitle>
          </CardHeader>
          <CardContent>
            <EconomicLicensesTable initialLicenses={initialLicenses || []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
  );
}
