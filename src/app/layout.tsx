import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseProvider } from '@/firebase/provider';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: {
    default: "Barbería César's",
    template: "%s | Barbería César's",
  },
  description: 'Gestión fiscal simplificada.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png', // favicon en public/logo.png
  },
  openGraph: {
    title: "Barbería César's",
    description: "Gestión fiscal simplificada.",
    url: "https://barberia-impuestos.vercel.app/",
    siteName: "Barbería César's",
    images: [
      {
        url: "/logo.png", // imagen en public/logo.png
        width: 800,
        height: 600,
        alt: "Logo Barbería César's",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
        <Toaster />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
