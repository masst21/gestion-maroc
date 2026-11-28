export const fields = ['supplier', 'reference', 'quantity', 'unitCost'] as const;
export type Field = typeof fields[number];
export type Mapping = Record<Field, number>;
export const aliases: Record<Field, string[]> = {
  supplier: ['fournisseur','nom fournisseur','nom du fournisseur','raison sociale','supplier','supplier name','vendor','vendor name','المورد','اسم المورد'],
  reference: ['référence article','référence','ref','ref article','code article','code produit','sku','article reference','product code','item code','reference article','مرجع المنتج','رمز المنتج','مرجع'],
  quantity: ['quantité','qte','qty','quantity','quantité achetée','nombre','الكمية','عدد'],
  unitCost: ['prix unitaire','prix achat','prix d achat','prix','prix unitaire mad','prix achat mad','prix unitaire ht','pu','unit cost','unit price','purchase price','سعر الوحدة','سعر الشراء','الثمن'],
};
export function normalize(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f]/g, '').replace(/\u0640/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
export function suggestMapping(headers: string[]): Mapping {
  return Object.fromEntries(fields.map(field => {
    const keys = aliases[field].map(normalize);
    const matches = headers.map((h,i) => keys.includes(normalize(h)) ? i : -1).filter(i => i >= 0);
    return [field, matches.length === 1 ? matches[0] : -1];
  })) as Mapping;
}
export function validMapping(mapping: unknown, columns: number): mapping is Mapping {
  if (!mapping || typeof mapping !== 'object') return false;
  const values = fields.map(f => (mapping as Mapping)[f]);
  return values.every(v => Number.isInteger(v) && v >= 0 && v < columns) && new Set(values).size === fields.length;
}
export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const s = String(value ?? '').trim().replace(/[\u0660-\u0669]/g,c=>String(c.charCodeAt(0)-0x660)).replace(/[\u06f0-\u06f9]/g,c=>String(c.charCodeAt(0)-0x6f0)).replace(/\u066b/g,'.').replace(/\u066c/g,',').replace(/[\s\u00a0\u202f]/g,'');
  if (!s) return NaN;
  let normalized = s;
  if (s.includes(',') && s.includes('.')) {
    const decimal = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    const thousands = decimal === ',' ? '.' : ',';
    const parts = s.split(decimal);
    if (parts.length !== 2 || !parts[1] || !/^\d+$/.test(parts[1])) return NaN;
    const groups = parts[0].split(thousands);
    if (!/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some(g=>!/^\d{3}$/.test(g))) return NaN;
    normalized = groups.join('') + '.' + parts[1];
  } else if (s.includes(',')) {
    normalized = s.replace(',', '.');
  }
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}
