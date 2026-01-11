'use client';
import { useUserRole } from "@/firebase/provider";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

export default function AdminPage() {
  const userRole = useUserRole();

  useEffect(() => {
     // Protect the route
    if (userRole !== null && userRole !== 'super_admin') {
      redirect('/impuestos');
    }
  }, [userRole]);
 
  if (userRole !== 'super_admin') {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Panel de Super Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Bienvenido, superadministrador. Desde aquí podrás gestionar la aplicación.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
