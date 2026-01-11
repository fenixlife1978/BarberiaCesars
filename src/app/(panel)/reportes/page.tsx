'use client';
import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { initializeFirebase } from '@/firebase';
import { useAuth, useUserRole } from '@/firebase/provider';
import TaxReport from "@/components/tax/TaxReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportesPage() {
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
    return query(recordsRef, orderBy('paymentDate', 'desc'));
  }, [recordsRef]);

  const { data: records, isLoading } = useCollection(recordsQuery);

  return (
    <div className="space-y-6">
       <div className="flex justify-start">
        <BackButton />
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Reporte de Impuestos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <TaxReport records={records || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
