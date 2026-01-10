
import { getSettings } from "@/app/actions";
import SettingsForm from "@/components/settings/SettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { getAuthenticatedUser } from "@/app/(auth)/get-authenticated-user";
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const settings = await getSettings(user.uid);

  return (
    <div className="flex flex-col items-center gap-6">
       <div className="w-full max-w-2xl flex justify-start">
        <BackButton />
      </div>
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
