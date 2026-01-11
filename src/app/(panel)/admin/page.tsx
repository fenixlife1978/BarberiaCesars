'use client';
import { useUserRole } from "@/firebase/provider";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const userRole = useUserRole();

  useEffect(() => {
     // Si el rol ya se cargó y no es super_admin, redirigir.
    if (userRole !== null && userRole !== 'super_admin') {
      redirect('/impuestos');
    }
  }, [userRole]);
 
  // Mientras el rol se está cargando (es null), muestra un loader.
  // O si después de cargar, resulta no ser super_admin (aunque el useEffect ya debería haber redirigido).
  if (userRole !== 'super_admin') {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  // Si el rol es super_admin, muestra el contenido.
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
