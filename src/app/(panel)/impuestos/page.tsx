
import TaxForm from "@/components/tax/TaxForm";
import { getTaxRecords } from "@/app/actions";
import TaxRecordsTable from "@/components/tax/TaxRecordsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ImpuestosPage() {
  // 1. Obtenemos los registros del servidor
  const rawRecords = await getTaxRecords();

  /**
   * 2. CORRECCIÓN CLAVE: Serialización
   * Next.js a veces falla al pasar objetos Date de la DB a componentes.
   * Al hacer stringify y parse, garantizamos que los datos sean JSON puro.
   */
  const initialRecords = JSON.parse(JSON.stringify(rawRecords));

  return (
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
  );
}
