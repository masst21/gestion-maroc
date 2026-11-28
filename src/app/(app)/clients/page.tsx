import { cookies } from 'next/headers';
import ClientsClient from './ClientsClient';

export default function ClientsPage() {
  return <ClientsClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
