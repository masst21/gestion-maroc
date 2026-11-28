import { sessionUserId } from '@/lib/session';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { cleanClient } from '@/lib/clientIdentity';
export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
async function auth(){
  const id=await sessionUserId();
  if(!id)return null;
  return prisma.user.findFirst({where:{id,isActive:true,role:{in:['admin','manager','cashier']}}});
}
function errorResponse(e:unknown){
  if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002')return fail('CIN_DUPLICATE',409);
  if(e instanceof Error&&['INVALID','CIN'].includes(e.message))return fail(e.message,400);
  return fail('UNAVAILABLE',503);
}
export async function GET(req:Request){
  try{
    const user=await auth();if(!user)return fail('FORBIDDEN',403);
    const id=new URL(req.url).searchParams.get('id');
    if(id){
      const client=await prisma.client.findFirst({where:{id,storeId:user.storeId,isActive:true},include:{sales:{select:{id:true,invoiceNo:true,saleDate:true,totalTtc:true,paidAmount:true,dueAmount:true,paymentStatus:true},orderBy:{saleDate:'desc'},take:50}}});
      if(!client)return fail('NOT_FOUND',404);
      return NextResponse.json(client,{headers:{'Cache-Control':'no-store'}});
    }
    const clients=await prisma.client.findMany({where:{storeId:user.storeId,isActive:true},select:{id:true,name:true,phone:true,email:true,ice:true,creditLimit:true,balance:true},orderBy:{name:'asc'}});
    return NextResponse.json(clients,{headers:{'Cache-Control':'no-store'}});
  }catch(e){return errorResponse(e);}
}
export async function POST(req:Request){
  try{
    const user=await auth();if(!user)return fail('FORBIDDEN',403);
    const body=await req.json().catch(()=>null);
    if(!body||typeof body!=='object')return fail('INVALID',400);
    const data=cleanClient(body);
    const result=await prisma.client.create({data:{...data,storeId:user.storeId},select:{id:true}});
    return NextResponse.json(result,{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(e){return errorResponse(e);}
}
export async function PATCH(req:Request){
  try{
    const user=await auth();if(!user)return fail('FORBIDDEN',403);
    const body=await req.json().catch(()=>null);
    if(!body||typeof body.id!=='string')return fail('INVALID',400);
    const data=cleanClient(body);
    const result=await prisma.client.updateMany({where:{id:body.id,storeId:user.storeId,isActive:true},data});
    if(result.count!==1)return fail('NOT_FOUND',404);
    return NextResponse.json({id:body.id},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return errorResponse(e);}
}
