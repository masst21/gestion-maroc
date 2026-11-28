import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';
import { suggestMapping, validMapping, parseNumber } from '@/lib/purchaseImport';

export const dynamic = 'force-dynamic';
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const text = (value: unknown) => String(value ?? '').trim();
type ImportRow = { line: number; supplier: string; reference: string; quantity: number; unitCost: number; articleId: string; total: number };

export async function POST(req: Request) {
  try {
    const id = cookies().get('gm_session')?.value;
    if (!id) return fail('Unauthorized',401);
    const user = await prisma.user.findFirst({ where: { id, isActive: true } });
    if (!user) return fail('Unauthorized',401);
    if (!['admin','manager'].includes(user.role)) return fail('Forbidden',403);
    const data = await req.formData();
    const file = data.get('file');
    const mode = data.get('mode');
    if (!file || typeof file === 'string' || !/\.(xlsx|xls|csv)$/i.test(file.name) || file.size === 0 || file.size > 3*1024*1024) return fail('INVALID_FILE');
    if (mode !== 'inspect' && mode !== 'preview' && mode !== 'commit') return fail('INVALID_MODE');
    let wb: XLSX.WorkBook;
    try {
      const buffer = await file.arrayBuffer();
      if (/\.csv$/i.test(file.name)) {
        const bytes = new Uint8Array(buffer);
        const csv = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        wb = XLSX.read(csv, { type:'string', raw:true });
      } else wb = XLSX.read(buffer, { type:'array', cellDates:false });
    } catch { return fail('UNREADABLE_FILE'); }
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws || !ws['!ref']) return fail('EMPTY_FILE');
    const range = XLSX.utils.decode_range(ws['!ref']);
    if (range.e.r-range.s.r > 500 || range.e.c-range.s.c >= 100) return fail('FILE_LIMIT');
    const formatted = XLSX.utils.sheet_to_json<unknown[]>(ws, { header:1, defval:'', blankrows:true, raw:false });
    const values = XLSX.utils.sheet_to_json<unknown[]>(ws, { header:1, defval:'', blankrows:true, raw:true });
    const headerRow = formatted.findIndex(row=>row.some(v=>text(v)!==''));
    if (headerRow < 0) return fail('EMPTY_FILE');
    const width = range.e.c-range.s.c+1;
    const headers = Array.from({length:width},(_,i)=>text(formatted[headerRow][i]));
    const indexes = formatted.map((row,i)=>i>headerRow && row.some(v=>text(v)!=='') ? i : -1).filter(i=>i>=0);
    if (!indexes.length) return fail('EMPTY_FILE');
    if (mode === 'inspect') return NextResponse.json({ headers, mapping:suggestMapping(headers), count:indexes.length, sample:indexes.slice(0,5).map(i=>headers.map((_,j)=>text(formatted[i][j]))) });
    let mapping: unknown;
    try { mapping=JSON.parse(String(data.get('mapping') || '')); } catch { return fail('INVALID_MAPPING'); }
    if (!validMapping(mapping,headers.length)) return fail('INVALID_MAPPING');
    const rows: ImportRow[] = [];
    const issues: { line:number; reason:string }[] = [];
    const refs = [...new Set(indexes.map(i=>text(formatted[i][mapping.reference])).filter(Boolean))];
    const articles = await prisma.article.findMany({ where:{storeId:user.storeId,isActive:true,reference:{in:refs}},select:{id:true,reference:true} });
    const articleMap = new Map(articles.map(a=>[a.reference,a.id]));
    for (const i of indexes) {
      const line=range.s.r+i+1;
      const supplier=text(formatted[i][mapping.supplier]);
      const reference=text(formatted[i][mapping.reference]);
      const quantity=parseNumber(values[i]?.[mapping.quantity]);
      const unitCost=parseNumber(values[i]?.[mapping.unitCost]);
      const articleId=articleMap.get(reference);
      const total=Math.round(quantity*unitCost*100)/100;
      let reason='';
      if (!supplier || supplier.length>200) reason='SUPPLIER';
      else if (!reference || !articleId) reason='REFERENCE';
      else if (!Number.isFinite(quantity)||quantity<=0) reason='QUANTITY';
      else if (!Number.isFinite(unitCost)||unitCost<0||!Number.isFinite(total)||total>Number.MAX_SAFE_INTEGER/100) reason='PRICE';
      if (reason || !articleId) {issues.push({line,reason:reason||'REFERENCE'});continue;}
      rows.push({line,supplier,reference,quantity,unitCost,articleId,total});
    }
    const total=rows.reduce((n,r)=>n+Math.round(r.total*100),0)/100;
    if (!Number.isFinite(total)||total>Number.MAX_SAFE_INTEGER/100) return fail('FILE_LIMIT');
    if (mode==='preview') return NextResponse.json({count:indexes.length,valid:rows.length,issues,total,rows:rows.slice(0,10).map(({articleId,...r})=>r)});
    if (issues.length||!rows.length) return NextResponse.json({error:'INVALID_ROWS',issues},{status:400});
    // All rows are validated before writing. A failed row rolls back the whole file.
    await prisma.$transaction(async tx=>{
      const suppliers=new Map<string,string>();
      for (const row of rows) {
        const key=row.supplier.toLocaleLowerCase('fr');
        let supplierId=suppliers.get(key);
        if (!supplierId) {
          const existing=await tx.supplier.findMany({where:{storeId:user.storeId,name:{equals:row.supplier,mode:'insensitive'}},take:2});
          if(existing.length>1) throw new Error('AMBIGUOUS_SUPPLIER');
          const supplier=existing[0] || await tx.supplier.create({data:{storeId:user.storeId,name:row.supplier}});
          supplierId=supplier.id;suppliers.set(key,supplierId);
        }
        const article=await tx.article.findFirst({where:{id:row.articleId,storeId:user.storeId,isActive:true},select:{id:true}});
        if(!article)throw new Error('ARTICLE_CHANGED');
        await tx.purchase.create({data:{storeId:user.storeId,supplierId,totalAmount:row.total,items:{create:[{articleId:article.id,quantity:row.quantity,unitCost:row.unitCost}]}}});
        await tx.article.update({where:{id:article.id},data:{stockQty:{increment:row.quantity},purchasePrice:row.unitCost}});
      }
    },{timeout:25000});
    return NextResponse.json({ok:true,imported:rows.length,errors:0,total});
  } catch(e) {
    if(e instanceof Error && e.message==='AMBIGUOUS_SUPPLIER') return fail('AMBIGUOUS_SUPPLIER',409);
    return fail('IMPORT_FAILED',500);
  }
}
