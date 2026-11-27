import { cookies } from 'next/headers';
import CurrenciesClient from './CurrenciesClient';

export default function CurrenciesPage() {
  return <CurrenciesClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
