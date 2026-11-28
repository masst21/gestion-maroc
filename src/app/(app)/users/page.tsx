import { cookies } from 'next/headers';
import UsersClient from './UsersClient';

export default function UsersPage() {
  return <UsersClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
