import { NextResponse } from 'next/server';
import { getReferenceRates } from '@/lib/referenceRates';
export const dynamic='force-dynamic';
export async function GET(){
  try{return NextResponse.json({source:'Bank Al-Maghrib',provider:'Frankfurter',rates:await getReferenceRates()},{headers:{'Cache-Control':'no-store'}});}
  catch{return NextResponse.json({error:'Reference rates unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
