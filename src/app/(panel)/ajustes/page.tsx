
import { getSettings } from "@/app/actions";
import SettingsForm from "@/components/settings/SettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Ajustes Generales</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm initialSettings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
