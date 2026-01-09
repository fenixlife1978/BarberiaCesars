import Header from "@/components/layout/Header";
import TaxForm from "@/components/tax/TaxForm";
import { getTaxRecords } from "@/app/actions";
import TaxRecordsTable from "@/components/tax/TaxRecordsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const initialRecords = await getTaxRecords();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Registrar Nuevo Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxForm />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 shadow-lg">
             <CardHeader>
              <CardTitle className="text-2xl font-headline">Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxRecordsTable initialRecords={initialRecords} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
