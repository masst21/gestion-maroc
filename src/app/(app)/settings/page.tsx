import { cookies } from 'next/headers';
import SettingsClient from './SettingsClient';

export default function SettingsPage() {
  return <SettingsClient lang={cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr'} />;
}
