import { sessionUserId } from '@/lib/session';
import {NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';
export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status});
async function auth(){
  const id=await sessionUserId();
  return id?prisma.user.findFirst({where:{id,isActive:true}}):null;
}
export async function GET(){
  try{
    const user=await auth();if(!user)return fail('Unauthorized',401);
    const articles=await prisma.article.findMany({where:{storeId:user.storeId,isActive:true},orderBy:{name:'asc'}});
    return NextResponse.json(articles,{headers:{'Cache-Control':'no-store'}});
  }catch{return fail('Chargement impossible',503);}
}
export async function POST(req:Request){
  try{
    const user=await auth();if(!user)return fail('Unauthorized',401);
    const b=await req.json().catch(()=>null);
    if(!b||typeof b!=='object')return fail('Données invalides',400);
    const str=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length<=max?v.trim():null;
    const reference=str(b.reference,120),name=str(b.name,200),barcode=b.barcode==null||b.barcode===''?'':str(b.barcode,100);
    const num=(v:unknown,def:number)=>v===undefined||v===''?def:typeof v==='number'||typeof v==='string'&&v.trim()!==''?Number(v):NaN;
    const salePriceHt=num(b.salePriceHt,0),vatRate=num(b.vatRate,20),stockQty=num(b.stockQty,0);
    const imageUrl=b.imageUrl==null||b.imageUrl===''?null:typeof b.imageUrl==='string'&&b.imageUrl.length<=1000000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(b.imageUrl)?b.imageUrl:undefined;
    if(!reference||!name||barcode===null||imageUrl===undefined||![salePriceHt,vatRate,stockQty].every(Number.isFinite)||salePriceHt<0||salePriceHt>1e12||vatRate<0||vatRate>100||stockQty<0||stockQty>1e12)return fail('Vérifiez les champs de l’article',400);
    const article=await prisma.article.create({data:{storeId:user.storeId,reference,name,barcode:barcode||null,imageUrl,salePriceHt,vatRate,stockQty}});
    return NextResponse.json(article,{status:201});
  }catch(e){
    if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002')return fail('Cette référence existe déjà',409);
    return fail('Enregistrement impossible',503);
  }
}
