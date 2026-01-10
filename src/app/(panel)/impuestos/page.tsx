
import TaxForm from "@/components/tax/TaxForm";
import { getTaxRecords } from "@/app/actions";
import TaxRecordsTable from "@/components/tax/TaxRecordsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaxChart from "@/components/tax/TaxChart";
import { getAuthenticatedUser } from "@/app/auth/get-authenticated-user";
import { redirect } from "next/navigation";

export default async function ImpuestosPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const rawRecords = await getTaxRecords(user.uid);

  const initialRecords = JSON.parse(JSON.stringify(rawRecords));

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
            <TaxChart records={initialRecords} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle className="text-2xl font-headline">Historial de Pagos de Impuestos</CardTitle>
           </CardHeader>
          <CardContent>
            <TaxRecordsTable initialRecords={initialRecords} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
