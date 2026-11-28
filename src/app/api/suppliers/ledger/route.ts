import { sessionUserId } from '@/lib/session';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkedRate,todayISO } from '@/lib/referenceRates';
export const dynamic='force-dynamic';
const roles=['admin','manager','accountant'];
const fail=(error:string,status=400)=>NextResponse.json({error},{status});
async function auth(){const id=await sessionUserId();if(!id)return null;return prisma.user.findFirst({where:{id,isActive:true,role:{in:roles}}});}
function optional(v:unknown,max:number){if(v===undefined||v===null||v==='')return null;if(typeof v!=='string'||v.trim().length>max)throw new Error('INVALID_PROFILE');return v.trim()||null;}
function required(v:unknown,max:number){const s=optional(v,max);if(!s)throw new Error('REQUIRED');return s;}
function day(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw new Error('INVALID_DATE');const d=new Date(v+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==v)throw new Error('INVALID_DATE');return d;}
function amount(v:unknown){if(typeof v!=='string'||!/^\d{1,12}(\.\d{1,4})?$/.test(v))throw new Error('INVALID_AMOUNT');const n=new Prisma.Decimal(v);if(n.lte(0))throw new Error('INVALID_AMOUNT');return n;}
function mad(n:Prisma.Decimal,r:Prisma.Decimal){const v=n.mul(r).toDecimalPlaces(2,Prisma.Decimal.ROUND_HALF_UP);if(v.lte(0)||v.gte('10000000000000000'))throw new Error('INVALID_AMOUNT');return v;}
export async function GET(req:Request){
  try{
    const user=await auth();if(!user)return fail('FORBIDDEN',403);
    const supplierId=new URL(req.url).searchParams.get('supplierId');
    if(!supplierId)return NextResponse.json(await prisma.supplier.findMany({where:{storeId:user.storeId},select:{id:true,name:true,phone:true,ice:true},orderBy:{name:'asc'}}));
    const supplier=await prisma.supplier.findFirst({where:{id:supplierId,storeId:user.storeId},include:{profile:true,invoices:{include:{payments:{orderBy:{paidAt:'desc'}}},orderBy:{dueDate:'asc'}},purchases:{orderBy:{createdAt:'desc'},take:50,select:{id:true,totalAmount:true,createdAt:true}}}});
    if(!supplier)return fail('NOT_FOUND',404);
    return NextResponse.json(supplier);
  }catch{return fail('LEDGER_UNAVAILABLE',503);}
}
export async function POST(req:Request){
  try{
    const user=await auth();if(!user)return fail('FORBIDDEN',403);
    const b=await req.json().catch(()=>null);
    if(!b||typeof b!=='object')return fail('INVALID_REQUEST');
    if(b.action==='profile'){
      if(!['admin','manager'].includes(user.role))return fail('FORBIDDEN',403);
      const id=optional(b.supplierId,100),name=required(b.name,200),phone=optional(b.phone,50),ice=optional(b.ice,15);
      if(ice&&!/^\d{15}$/.test(ice))return fail('INVALID_PROFILE');
      const email=optional(b.email,254);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail('INVALID_PROFILE');
      const paymentTermDays=Number(b.paymentTermDays);
      if(!Number.isInteger(paymentTermDays)||paymentTermDays<0||paymentTermDays>365)return fail('INVALID_PROFILE');
      const preferredCurrency=required(b.preferredCurrency,3).toUpperCase();
      if(!/^[A-Z]{3}$/.test(preferredCurrency))return fail('INVALID_CURRENCY');
      const profile={contactName:optional(b.contactName,200),email,address:optional(b.address,500),city:optional(b.city,120),country:required(b.country,120),taxId:optional(b.taxId,80),tradeRegister:optional(b.tradeRegister,80),bankName:optional(b.bankName,200),bankAccount:optional(b.bankAccount,100),swift:optional(b.swift,20),paymentTermDays,preferredCurrency,notes:optional(b.notes,2000)};
      const result=await prisma.$transaction(async tx=>{
        if(id&&!await tx.supplier.findFirst({where:{id,storeId:user.storeId},select:{id:true}}))throw new Error('NOT_FOUND');
        const existing=await tx.supplier.findFirst({where:{storeId:user.storeId,...(id?{id:{not:id}}:{}),OR:[{name:{equals:name,mode:'insensitive'}},...(ice?[{ice}]:[])]},select:{id:true}});
        if(existing)throw new Error('DUPLICATE');
        const supplier=id?await tx.supplier.update({where:{id},data:{name,phone,ice}}):await tx.supplier.create({data:{storeId:user.storeId,name,phone,ice}});
        await tx.supplierProfile.upsert({where:{supplierId:supplier.id},create:{supplierId:supplier.id,...profile},update:profile});
        return {id:supplier.id};
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
      return NextResponse.json(result);
    }
    if(b.action==='invoice'){
      const supplierId=required(b.supplierId,100),invoiceNo=required(b.invoiceNo,100),currency=required(b.currency,3),n=amount(b.amount),invoiceDate=day(b.invoiceDate),dueDate=day(b.dueDate);
      if(dueDate<invoiceDate||b.invoiceDate>todayISO())return fail('INVALID_DATE');
      const supplier=await prisma.supplier.findFirst({where:{id:supplierId,storeId:user.storeId},select:{id:true}});if(!supplier)return fail('NOT_FOUND',404);
      const fx=await checkedRate(currency,b.expectedRate,b.expectedDate);
      const invoice=await prisma.supplierInvoice.create({data:{supplierId,invoiceNo,invoiceDate,dueDate,currency,amount:n,rate:fx.rate,rateDate:fx.date,amountMad:mad(n,fx.rate),createdBy:user.id}});
      return NextResponse.json({id:invoice.id},{status:201});
    }
    if(b.action==='payment'){
      const invoiceId=required(b.invoiceId,100),requestId=required(b.requestId,100),n=amount(b.amount),paidAt=day(b.paidAt),method=required(b.method,20),reference=optional(b.reference,150);
      if(!['bank','cash','card','cheque','other'].includes(method)||b.paidAt>todayISO())return fail('INVALID_PAYMENT');
      const invoice=await prisma.supplierInvoice.findFirst({where:{id:invoiceId,supplier:{storeId:user.storeId}},select:{id:true,currency:true,invoiceDate:true}});
      if(!invoice)return fail('NOT_FOUND',404);
      if(paidAt<invoice.invoiceDate)return fail('INVALID_DATE');
      if(b.currency!==invoice.currency)return fail('INVALID_CURRENCY');
      const existing=await prisma.supplierPayment.findUnique({where:{invoiceId_requestId:{invoiceId,requestId}}});
      if(existing){
        if(!existing.amount.eq(n)||existing.paidAt.getTime()!==paidAt.getTime()||existing.method!==method||existing.reference!==reference)return fail('DUPLICATE',409);
        return NextResponse.json({id:existing.id});
      }
      const fx=await checkedRate(invoice.currency,b.expectedRate,b.expectedDate);
      const payment=await prisma.$transaction(async tx=>{
        const locked=await tx.supplierInvoice.findFirst({where:{id:invoiceId,supplier:{storeId:user.storeId}}});if(!locked)throw new Error('NOT_FOUND');
        const sum=await tx.supplierPayment.aggregate({where:{invoiceId},_sum:{amount:true}});
        const remaining=locked.amount.minus(sum._sum.amount||0);
        if(n.gt(remaining))throw new Error('OVERPAYMENT');
        return tx.supplierPayment.create({data:{invoiceId,requestId,amount:n,currency:locked.currency,rate:fx.rate,rateDate:fx.date,amountMad:mad(n,fx.rate),paidAt,method,reference,createdBy:user.id}});
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
      return NextResponse.json({id:payment.id},{status:201});
    }
    return fail('INVALID_REQUEST');
  }catch(e){
    if(e instanceof Prisma.PrismaClientKnownRequestError){
      if(e.code==='P2002'||e.code==='P2034')return fail('CONFLICT',409);
      return fail('LEDGER_UNAVAILABLE',503);
    }
    const code=e instanceof Error?e.message:'';
    if(['REQUIRED','INVALID_PROFILE','INVALID_DATE','INVALID_AMOUNT','INVALID_CURRENCY','OVERPAYMENT','DUPLICATE','NOT_FOUND','RATE_CHANGED','RATE_UNAVAILABLE'].includes(code))return fail(code,code==='RATE_UNAVAILABLE'?503:code==='NOT_FOUND'?404:code==='RATE_CHANGED'||code==='DUPLICATE'?409:400);
    return fail('LEDGER_UNAVAILABLE',503);
  }
}
