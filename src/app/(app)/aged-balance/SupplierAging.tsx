import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { todayISO } from '@/lib/referenceRates';

export default async function SupplierAging({storeId,lang}:{storeId:string;lang:'fr'|'ar'}){
  const tr=(fr:string,ar:string)=>lang==='ar'?ar:fr;
  try{
    const invoices=await prisma.supplierInvoice.findMany({where:{supplier:{storeId}},include:{supplier:{select:{id:true,name:true}},payments:{select:{amount:true}}}});
    const now=Date.parse(todayISO());
    type Row={key:string;name:string;currency:string;values:Prisma.Decimal[];mad:Prisma.Decimal};
    const rows=new Map<string,Row>();
    for(const invoice of invoices){
      const paid=invoice.payments.reduce((n,p)=>n.plus(p.amount),new Prisma.Decimal(0));
      const remaining=invoice.amount.minus(paid);
      if(remaining.lte(0))continue;
      const days=Math.floor((now-invoice.dueDate.getTime())/86400000);
      const bucket=days<=0?0:days<=30?1:days<=60?2:days<=90?3:4;
      const key=invoice.supplier.id+':'+invoice.currency;
      const row=rows.get(key)||{key,name:invoice.supplier.name,currency:invoice.currency,values:Array.from({length:5},()=>new Prisma.Decimal(0)),mad:new Prisma.Decimal(0)};
      row.values[bucket]=row.values[bucket].plus(remaining);
      row.mad=row.mad.plus(remaining.mul(invoice.rate).toDecimalPlaces(2,Prisma.Decimal.ROUND_HALF_UP));
      rows.set(key,row);
    }
    const money=(n:Prisma.Decimal,c:string)=>new Intl.NumberFormat(lang==='ar'?'ar-MA':'fr-MA',{minimumFractionDigits:2,maximumFractionDigits:4}).format(n.toNumber())+' '+c;
    const total=[...rows.values()].reduce((n,r)=>n.plus(r.mad),new Prisma.Decimal(0));
    return <section className="bg-white border rounded-xl p-4 space-y-3">
      <h2 className="font-bold text-xl">{tr('Balance âgée — Fournisseurs','أعمار ديون الموردين')}</h2>
      <p className="text-sm text-gray-600">{tr('Classement par échéance contractuelle. Restes dus dans la devise de facture ; équivalent MAD au cours initial enregistré, sans réévaluation ni frais bancaires. Les anciens achats non rapprochés sont exclus.','حسب تاريخ الاستحقاق. المتبقي بعملة الفاتورة والمقابل بالدرهم بالسعر الأولي دون إعادة تقييم أو رسوم. المشتريات القديمة غير المطابقة مستثناة.')}</p>
      <p className="font-bold" dir="ltr">{money(total,'MAD')}</p>
      <div className="store-table-scroll overflow-auto" tabIndex={0}><table className="store-data-table w-full min-w-[920px] text-sm"><thead><tr>{[tr('Fournisseur','المورد'),tr('Devise','العملة'),tr('Non échues','غير مستحقة'),'1–30 j','31–60 j','61–90 j','90+ j',tr('Total devise','الإجمالي بالعملة'),tr('Équivalent initial MAD','المقابل الأولي')].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{[...rows.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(r=><tr key={r.key}><td className="p-2">{r.name}</td><td className="p-2">{r.currency}</td>{r.values.map((v,i)=><td key={i} className="p-2" dir="ltr">{money(v,r.currency)}</td>)}<td className="p-2 font-bold" dir="ltr">{money(r.values.reduce((n,v)=>n.plus(v),new Prisma.Decimal(0)),r.currency)}</td><td className="p-2" dir="ltr">{money(r.mad,'MAD')}</td></tr>)}{!rows.size&&<tr><td colSpan={9} className="p-3">{tr('Aucune facture fournisseur ouverte enregistrée.','لا توجد فواتير مفتوحة مسجلة.')}</td></tr>}</tbody></table></div>
    </section>;
  }catch{return <section role="alert" className="bg-amber-50 border rounded p-3">{tr('Balance fournisseurs indisponible : mise à niveau de la base à vérifier.','ميزان الموردين غير متاح: تحقق من ترقية قاعدة البيانات.')}</section>;}
}
