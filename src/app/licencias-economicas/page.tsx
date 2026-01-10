import Header from "@/components/layout/Header";
import { getEconomicLicenses } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EconomicLicenseForm from "@/components/license/EconomicLicenseForm";
import EconomicLicensesTable from "@/components/license/EconomicLicensesTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EconomicLicensesPage() {
  const initialLicenses = await getEconomicLicenses();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="flex justify-end mb-4">
          <Button asChild>
            <Link href="/">Ir a Pagos de Impuestos</Link>
          </Button>
        </div>
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
      </main>
    </div>
  );
}
