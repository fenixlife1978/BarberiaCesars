// The middleware will redirect to /login if not authenticated,
// or to /impuestos if authenticated.
// This page can remain as a fallback.

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
}
