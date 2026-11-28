import { cookies } from 'next/headers';
import ArticlesClient from './ArticlesClient';

export default function ArticlesPage() {
  return <ArticlesClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
