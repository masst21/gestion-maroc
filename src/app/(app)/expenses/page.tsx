import { cookies } from 'next/headers';
import ExpensesClient from './ExpensesClient';

export default function ExpensesPage() {
  const lang = cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr';
  return <ExpensesClient lang={lang} />;
}
