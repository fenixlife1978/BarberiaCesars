
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from './(auth)/get-authenticated-user';

export default async function HomePage() {
  const user = await getAuthenticatedUser();
  
  if (user) {
    redirect('/impuestos');
  } else {
    redirect('/login');
  }
}
