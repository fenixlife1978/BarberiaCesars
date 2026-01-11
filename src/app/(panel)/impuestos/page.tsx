'use client';
import TaxForm from "@/components/tax/TaxForm";
import { useCollection } from "@/firebase/firestore/use-collection";
import TaxRecordsTable from "@/components/tax/TaxRecordsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaxChart from "@/components/tax/TaxChart";
import { useAuth, useUserRole } from "@/firebase/provider";
import { useMemo } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

export default function ImpuestosPage() {
  const user = useAuth();
  const userRole = useUserRole();
  const { firestore } = initializeFirebase();

  const userIdToQuery = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);

  const recordsRef = useMemo(() => {
    if (!userIdToQuery) return null;
    return collection(firestore, `users/${userIdToQuery}/taxRecords`);
  }, [userIdToQuery, firestore]);
  
  const recordsQuery = useMemo(() => {
    if (!recordsRef) return null;
    return query(recordsRef, orderBy('createdAt', 'desc'));
  }, [recordsRef]);

  const { data: initialRecords, isLoading } = useCollection(recordsQuery);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Registrar Nuevo Pago de Impuestos</CardTitle>
          </CardHeader>
          <CardContent>
            <TaxForm />
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-3 flex flex-col gap-8">
        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle className="text-2xl font-headline">Impuestos de los Últimos 6 Meses (€)</CardTitle>
           </CardHeader>
          <CardContent>
            <TaxChart records={initialRecords || []} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle className="text-2xl font-headline">Historial de Pagos de Impuestos</CardTitle>
           </CardHeader>
          <CardContent>
            <TaxRecordsTable initialRecords={initialRecords || []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
