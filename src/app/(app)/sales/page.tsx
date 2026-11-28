import { cookies } from 'next/headers';
import SalesClient from './SalesClient';

export default function SalesPage() {
  return <SalesClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
