import { cookies } from 'next/headers';
import CashClient from './CashClient';

export default function CashPage() {
  return <CashClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
