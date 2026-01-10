
import { getEconomicLicenses } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EconomicLicenseForm from "@/components/license/EconomicLicenseForm";
import EconomicLicensesTable from "@/components/license/EconomicLicensesTable";
import { getAuthenticatedUser } from "@/app/auth/get-authenticated-user";
import { redirect } from 'next/navigation';

export default async function EconomicLicensesPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    // This check is redundant due to layout, but good for safety
    redirect('/login');
  }
  const initialLicenses = await getEconomicLicenses(user.uid);

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
          </Header>
          <CardContent>
            <EconomicLicensesTable initialLicenses={initialLicenses} />
          </CardContent>
        </Card>
      </div>
  );
}
