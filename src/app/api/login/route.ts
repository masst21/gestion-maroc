import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';

export async function POST(req:Request){
 try {
  const body=await req.json();
  if(typeof body?.email!=='string'||typeof body?.password!=='string'||body.email.length>254||body.password.length>200||!body.email.trim()||!body.password)return NextResponse.json({error:'Identifiants invalides'},{status:401});
  const user=await prisma.user.findUnique({where:{email:body.email.trim().toLowerCase()}});
  if(!user||!user.isActive||!(await bcrypt.compare(body.password,user.password)))return NextResponse.json({error:'Identifiants invalides'},{status:401});
  await createSession(user.id);
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Connexion impossible'},{status:500});}
}
