// This is a placeholder file. The actual login page is in app/login/page.tsx.
// The middleware will redirect to /login if not authenticated.
// We are moving the previous content of page.tsx to /impuestos/page.tsx.

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/impuestos');
}
