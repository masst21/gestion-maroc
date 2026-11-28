import { normalize } from './purchaseImport';
export type Catalog = 'articles' | 'clients' | 'suppliers';
export type Column = { key:string; fr:string; ar:string; required?:boolean; type?:'number'|'ice'|'email'; max?:number; aliases:string[] };
export const columns: Record<Catalog, Column[]> = {
  articles: [
    {key:'reference',fr:'Référence',ar:'المرجع',required:true,max:120,aliases:['ref','sku','code article','code produit','référence article','reference','رمز المنتج']},
    {key:'name',fr:'Désignation',ar:'التسمية',required:true,max:200,aliases:['nom','nom article','libellé','article','product name','description','اسم المنتج']},
    {key:'nameAr',fr:'Nom arabe',ar:'الاسم بالعربية',max:200,aliases:['designation arabe','arabic name','اسم عربي']},
    {key:'barcode',fr:'Code-barres',ar:'الباركود',max:100,aliases:['barcode','ean','code barre']},
    {key:'category',fr:'Catégorie',ar:'الفئة',max:120,aliases:['famille','category','groupe']},
    {key:'purchasePrice',fr:'Prix achat',ar:'سعر الشراء',type:'number',aliases:['prix d achat','purchase price','cost price','prix achat mad']},
    {key:'salePriceHt',fr:'Prix vente HT',ar:'سعر البيع دون ضريبة',type:'number',aliases:['prix de vente ht','prix ht','sale price ht','prix vente ht mad']},
    {key:'vatRate',fr:'TVA (%)',ar:'الضريبة (%)',type:'number',aliases:['tva','taux tva','vat','vat rate']},
    {key:'stockQty',fr:'Stock',ar:'المخزون',type:'number',aliases:['stock initial','quantité stock','stock qty','stock quantity']},
    {key:'stockMin',fr:'Stock min',ar:'الحد الأدنى للمخزون',type:'number',aliases:['stock minimum','seuil stock','minimum stock']},
  ],
  clients: [
    {key:'name',fr:'Nom du client',ar:'اسم العميل',required:true,max:200,aliases:['nom','client','raison sociale','customer','customer name','name','الاسم']},
    {key:'phone',fr:'Téléphone',ar:'الهاتف',max:50,aliases:['tel','gsm','mobile','phone','whatsapp','رقم الهاتف']},
    {key:'email',fr:'E-mail',ar:'البريد الإلكتروني',type:'email',max:254,aliases:['email','mail','courriel']},
    {key:'ice',fr:'ICE',ar:'المعرف الموحد للمقاولة',type:'ice',aliases:['identifiant commun entreprise']},
    {key:'creditLimit',fr:'Plafond crédit (MAD)',ar:'سقف الائتمان',type:'number',aliases:['plafond','plafond crédit','credit limit','limite crédit']},
  ],
  suppliers: [
    {key:'name',fr:'Nom du fournisseur',ar:'اسم المورد',required:true,max:200,aliases:['nom','fournisseur','nom fournisseur','raison sociale','supplier','supplier name','vendor','المورد']},
    {key:'phone',fr:'Téléphone',ar:'الهاتف',max:50,aliases:['tel','gsm','mobile','phone','whatsapp','رقم الهاتف']},
    {key:'ice',fr:'ICE',ar:'المعرف الموحد للمقاولة',type:'ice',aliases:['identifiant commun entreprise']},
  ],
};
export type CatalogMapping = Record<string,number>;
export function catalogMapping(kind:Catalog, headers:string[]):CatalogMapping {
  return Object.fromEntries(columns[kind].map(c=>{
    const known=[c.fr,c.ar,c.key,...c.aliases].map(normalize);
    const matches=headers.map((h,i)=>known.includes(normalize(h))?i:-1).filter(i=>i>=0);
    return [c.key,matches.length===1?matches[0]:-1];
  }));
}
export function validCatalogMapping(kind:Catalog, mapping:unknown, width:number):mapping is CatalogMapping {
  if(!mapping||typeof mapping!=='object')return false;
  const m=mapping as CatalogMapping;
  if(!columns[kind].every(c=>Number.isInteger(m[c.key])&&((!c.required&&m[c.key]===-1)||(m[c.key]>=0&&m[c.key]<width))))return false;
  const used=columns[kind].map(c=>m[c.key]).filter(i=>i>=0);
  return used.length===new Set(used).size;
}
