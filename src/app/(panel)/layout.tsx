
import Header from "@/components/layout/Header";
import { getAuthenticatedUser } from "@/app/(auth)/get-authenticated-user";
import { redirect } from 'next/navigation';

export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
