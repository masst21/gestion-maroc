import { NextResponse } from 'next/server';
import { revokeSession } from '@/lib/session';
export async function POST(){
 try{await revokeSession();return NextResponse.json({ok:true});}
 catch{return NextResponse.json({error:'Déconnexion impossible'},{status:503});}
}
