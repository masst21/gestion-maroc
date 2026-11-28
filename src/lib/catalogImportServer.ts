import { sessionUserId } from '@/lib/session';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { parseNumber } from '@/lib/purchaseImport';
import { columns, catalogMapping, validCatalogMapping, type Catalog } from '@/lib/catalogImport';

const fail=(error:string,status=400)=>NextResponse.json({error},{status});
const text=(v:unknown)=>String(v??'').trim();
type Values=Record<string,string|number>;
type Row={line:number; values:Values; action:'create'|'update'; id?:string};
type Issue={line:number;reason:string;field?:string};
function articleData(v:Values): Prisma.ArticleUpdateInput {
  const data:Prisma.ArticleUpdateInput={name:String(v.name)};
  for(const k of ['nameAr','barcode','category'] as const)if(typeof v[k]==='string')data[k]=v[k] as string;
  for(const k of ['purchasePrice','salePriceHt','vatRate','stockQty','stockMin'] as const)if(typeof v[k]==='number')data[k]=v[k] as number;
  return data;
}
export async function importCatalog(req:Request, kind:Catalog) {
  try {
    const id=await sessionUserId();
    if(!id)return fail('UNAUTHORIZED',401);
    const user=await prisma.user.findFirst({where:{id,isActive:true}});
    if(!user)return fail('UNAUTHORIZED',401);
    if(!['admin','manager'].includes(user.role))return fail('FORBIDDEN',403);
    const form=await req.formData(),file=form.get('file'),mode=form.get('mode');
    const update=kind==='articles'&&form.get('update')==='true';
    if(!file||typeof file==='string'||! /\.(xlsx|xls|csv)$/i.test(file.name)||!file.size||file.size>3*1024*1024)return fail('INVALID_FILE');
    if(mode!=='inspect'&&mode!=='preview'&&mode!=='commit')return fail('INVALID_MODE');
    let wb:XLSX.WorkBook;
    try{
      const buffer=await file.arrayBuffer();
      wb=/\.csv$/i.test(file.name)?XLSX.read(new TextDecoder('utf-8',{fatal:true}).decode(buffer),{type:'string',raw:true}):XLSX.read(buffer,{type:'array',cellDates:false});
    }catch{return fail('UNREADABLE_FILE');}
    const ws=wb.Sheets[wb.SheetNames[0]];
    if(!ws||!ws['!ref'])return fail('EMPTY_FILE');
    const range=XLSX.utils.decode_range(ws['!ref']);
    if(range.e.r-range.s.r>500||range.e.c-range.s.c>=100)return fail('FILE_LIMIT');
    const fmt=XLSX.utils.sheet_to_json<unknown[]>(ws,{header:1,defval:'',blankrows:true,raw:false});
    const vals=XLSX.utils.sheet_to_json<unknown[]>(ws,{header:1,defval:'',blankrows:true,raw:true});
    const headerRow=fmt.findIndex(r=>r.some(v=>text(v)!==''));
    if(headerRow<0)return fail('EMPTY_FILE');
    const headers=Array.from({length:range.e.c-range.s.c+1},(_,i)=>text(fmt[headerRow][i]));
    const indexes=fmt.map((r,i)=>i>headerRow&&r.some(v=>text(v)!=='')?i:-1).filter(i=>i>=0);
    if(!indexes.length)return fail('EMPTY_FILE');
    if(mode==='inspect')return NextResponse.json({headers,mapping:catalogMapping(kind,headers),count:indexes.length,sample:indexes.slice(0,5).map(i=>headers.map((_,j)=>text(fmt[i][j])))});
    let mapping:unknown;
    try{mapping=JSON.parse(String(form.get('mapping')||''));}catch{return fail('INVALID_MAPPING');}
    if(!validCatalogMapping(kind,mapping,headers.length))return fail('INVALID_MAPPING');
    const rows:Row[]=[],issues:Issue[]=[];
    const seen=new Set<string>();
    const storeId=user.storeId;
    async function validate(db:Prisma.TransactionClient, source:Row[]) {
      for(const row of source){
        const v=row.values;
        if(kind==='articles'){
          const existing=await db.article.findUnique({where:{storeId_reference:{storeId,reference:String(v.reference)}},select:{id:true,isActive:true}});
          if(existing){
            if(!update||!existing.isActive){issues.push({line:row.line,reason:'DUPLICATE'});continue;}
            row.action='update';row.id=existing.id;
          }
        } else {
          const name=String(v.name),ice=typeof v.ice==='string'?v.ice:undefined;
          const where={storeId,OR:[{name:{equals:name,mode:'insensitive' as const}},...(ice?[{ice}]:[])]};
          const existing=kind==='clients'?await db.client.findFirst({where,select:{id:true}}):await db.supplier.findFirst({where,select:{id:true}});
          if(existing)issues.push({line:row.line,reason:'DUPLICATE'});
        }
      }
    }
    for(const i of indexes){
      const line=range.s.r+i+1,v:Values={};
      let invalid=false;
      for(const c of columns[kind]){
        const j=mapping[c.key];
        if(j<0)continue;
        const s=text(fmt[i][j]);
        if(!s){if(c.required){issues.push({line,reason:'REQUIRED',field:c.key});invalid=true;}continue;}
        if(c.type==='number'){
          const cell=vals[i]?.[j];
          const numeric=c.key==='vatRate'&&typeof s==='string'&&s.endsWith('%')?parseNumber(s.slice(0,-1)):parseNumber(cell);
          if(!Number.isFinite(numeric)||numeric<0||numeric>1e12||(c.key==='vatRate'&&numeric>100)){issues.push({line,reason:'NUMBER',field:c.key});invalid=true;continue;}
          v[c.key]=numeric;
        } else {
          if((c.max&&s.length>c.max)||(c.type==='ice'&&!/^\d{15}$/.test(s))||(c.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))){issues.push({line,reason:'FORMAT',field:c.key});invalid=true;continue;}
          v[c.key]=s;
        }
      }
      if(invalid)continue;
      const keys=kind==='articles'?['ref:'+String(v.reference)]:['name:'+String(v.name).toLowerCase(),...(v.ice?['ice:'+v.ice]:[])];
      if(keys.some(k=>seen.has(k))){issues.push({line,reason:'DUPLICATE_FILE'});continue;}
      keys.forEach(k=>seen.add(k));rows.push({line,values:v,action:'create'});
    }
    if(mode==='preview'){
      await validate(prisma,rows);
      const invalid=new Set(issues.map(i=>i.line));
      const good=rows.filter(r=>!invalid.has(r.line));
      return NextResponse.json({count:indexes.length,valid:good.length,creates:good.filter(r=>r.action==='create').length,updates:good.filter(r=>r.action==='update').length,issues,rows:good.slice(0,10).map(({id,...r})=>r)});
    }
    if(issues.length||!rows.length)return NextResponse.json({error:'INVALID_ROWS',issues},{status:400});
    await prisma.$transaction(async tx=>{
      await validate(tx,rows);
      if(issues.length)throw new Error('INVALID_ROWS');
      for(const row of rows){
        const v=row.values;
        if(kind==='articles'){
          const data=articleData(v);
          if(row.action==='update'&&row.id)await tx.article.update({where:{id:row.id},data});
          else await tx.article.create({data:{storeId,reference:String(v.reference),name:String(v.name),nameAr:typeof v.nameAr==='string'?v.nameAr:undefined,barcode:typeof v.barcode==='string'?v.barcode:undefined,category:typeof v.category==='string'?v.category:undefined,purchasePrice:typeof v.purchasePrice==='number'?v.purchasePrice:undefined,salePriceHt:typeof v.salePriceHt==='number'?v.salePriceHt:undefined,vatRate:typeof v.vatRate==='number'?v.vatRate:undefined,stockQty:typeof v.stockQty==='number'?v.stockQty:undefined,stockMin:typeof v.stockMin==='number'?v.stockMin:undefined}});
        } else {
          const common={storeId,name:String(v.name),phone:typeof v.phone==='string'?v.phone:undefined,ice:typeof v.ice==='string'?v.ice:undefined};
          if(kind==='clients')await tx.client.create({data:{...common,email:typeof v.email==='string'?v.email:undefined,creditLimit:typeof v.creditLimit==='number'?v.creditLimit:undefined}});
          else await tx.supplier.create({data:common});
        }
      }
    },{timeout:25000,isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json({ok:true,imported:rows.length,creates:rows.filter(r=>r.action==='create').length,updates:rows.filter(r=>r.action==='update').length});
  }catch(e){
    if(e instanceof Error&&e.message==='INVALID_ROWS')return fail('INVALID_ROWS',409);
    return fail('IMPORT_FAILED',500);
  }
}
