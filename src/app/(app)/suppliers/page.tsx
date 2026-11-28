import { sessionUserId } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SupplierClient from './SupplierClient';
import { todayISO } from '@/lib/referenceRates';
export const dynamic='force-dynamic';
export default async function SuppliersPage(){
  const id=await sessionUserId();
  if(!id)redirect('/login');
  const user=await prisma.user.findFirst({where:{id,isActive:true}});
  if(!user||!['admin','manager','accountant'].includes(user.role))redirect('/dashboard');
  return <SupplierClient lang={cookies().get('lang')?.value==='ar'?'ar':'fr'} canEdit={['admin','manager'].includes(user.role)} today={todayISO()}/>;
}
