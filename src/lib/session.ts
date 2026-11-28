import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'gm_session';
const MAX_AGE = 8 * 60 * 60;
const hash = (token:string) => createHash('sha256').update(token).digest('hex');
const valid = (token:unknown):token is string => typeof token==='string' && /^[a-f0-9]{64}$/.test(token);

function secureCookie() {
  // Production HTTPS uses Secure; the packaged local Electron server uses loopback HTTP.
  return process.env.VERCEL==='1' || headers().get('x-forwarded-proto')==='https';
}

export async function sessionUserId():Promise<string> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!valid(token)) return '';
  const row=await prisma.authSession.findUnique({where:{tokenHash:hash(token)},select:{expiresAt:true,user:{select:{id:true,isActive:true}}}});
  if(!row||!row.user.isActive||row.expiresAt.getTime()<=Date.now()) return '';
  return row.user.id;
}

export async function createSession(userId:string) {
  const token=randomBytes(32).toString('hex');
  const old=cookies().get(SESSION_COOKIE)?.value;
  await prisma.$transaction(async tx=>{
    if(valid(old)) await tx.authSession.deleteMany({where:{tokenHash:hash(old)}});
    await tx.authSession.deleteMany({where:{userId,expiresAt:{lte:new Date()}}});
    await tx.authSession.create({data:{tokenHash:hash(token),userId,expiresAt:new Date(Date.now()+MAX_AGE*1000)}});
  });
  cookies().set(SESSION_COOKIE,token,{httpOnly:true,secure:secureCookie(),sameSite:'lax',maxAge:MAX_AGE,path:'/'});
}

export async function revokeSession(){
  const token=cookies().get(SESSION_COOKIE)?.value;
  if(valid(token))await prisma.authSession.deleteMany({where:{tokenHash:hash(token)}});
  cookies().set(SESSION_COOKIE,'',{httpOnly:true,secure:secureCookie(),sameSite:'lax',maxAge:0,path:'/'});
}
