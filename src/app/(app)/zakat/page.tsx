import { cookies } from 'next/headers';
import ZakatClient from './ZakatClient';

export default function ZakatPage() {
  return <ZakatClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
