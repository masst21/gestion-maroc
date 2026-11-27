import { cookies } from 'next/headers';
import AccountingClient from './AccountingClient';

export default function AccountingPage() {
  return <AccountingClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
