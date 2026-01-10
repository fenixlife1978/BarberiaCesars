
import { getAuthenticatedUser } from "@/app/(auth)/get-authenticated-user";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const user = await getAuthenticatedUser();

  // Protect the route
  if (!user || user.role !== 'admin') {
    redirect('/impuestos');
  }

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Panel de Administrador</CardTitle>
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
