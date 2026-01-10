import Header from "@/components/layout/Header";
import TaxForm from "@/components/tax/TaxForm";
import { getTaxRecords } from "@/app/actions";
import TaxRecordsTable from "@/components/tax/TaxRecordsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Home() {
  // 1. Obtenemos los registros del servidor
  const rawRecords = await getTaxRecords();

  /**
   * 2. CORRECCIÓN CLAVE: Serialización
   * Next.js 15 con Turbopack a veces falla al pasar objetos Date de la DB a componentes.
   * Al hacer stringify y parse, garantizamos que los datos sean JSON puro.
   */
  const initialRecords = JSON.parse(JSON.stringify(rawRecords));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="flex justify-end mb-4">
          <Button asChild>
            <Link href="/licencias-economicas">Ir a Licencias Económicas</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Registrar Nuevo Pago de Impuestos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Este formulario gatilla la acción que guarda los datos */}
              <TaxForm />
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3 shadow-lg">
             <CardHeader>
              <CardTitle className="text-2xl font-headline">Historial de Pagos de Impuestos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Pasamos los registros ya serializados para evitar errores de hidratación */}
              <TaxRecordsTable initialRecords={initialRecords} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}