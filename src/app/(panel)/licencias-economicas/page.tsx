
import { getEconomicLicenses } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EconomicLicenseForm from "@/components/license/EconomicLicenseForm";
import EconomicLicensesTable from "@/components/license/EconomicLicensesTable";

export default async function EconomicLicensesPage() {
  const initialLicenses = await getEconomicLicenses();

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
            <EconomicLicensesTable initialLicenses={initialLicenses} />
          </CardContent>
        </Card>
      </div>
  );
}
