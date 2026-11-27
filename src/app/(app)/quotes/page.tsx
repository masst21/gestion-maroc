import { cookies } from 'next/headers';
import QuotesClient from './QuotesClient';

export default function QuotesPage() {
  return <QuotesClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
