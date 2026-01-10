
import { getTaxRecords } from "@/app/actions";
import TaxReport from "@/components/tax/TaxReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportesPage() {
  const rawRecords = await getTaxRecords();
  const records = JSON.parse(JSON.stringify(rawRecords));

  return (
    <div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Reporte de Impuestos</CardTitle>
        </CardHeader>
        <CardContent>
            <TaxReport records={records} />
        </CardContent>
      </Card>
    </div>
  );
}
