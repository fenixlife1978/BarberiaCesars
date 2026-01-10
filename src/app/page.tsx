
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Always redirect to the login page from the root
  redirect('/login');
}
