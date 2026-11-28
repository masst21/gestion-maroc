export function normalizeCin(value:string) { return value.trim().toUpperCase().replace(/[\s-]+/g,''); }
export function validCin(value:string) { return /^[A-Z]{1,3}[0-9]{1,10}$/.test(value); }
export function cleanClient(body:Record<string,unknown>) {
  const field=(key:string,max:number)=>{
    const v=body[key];
    if(v===undefined)return undefined;
    if(v===null)return null;
    if(typeof v!=='string'||v.trim().length>max)throw new Error('INVALID');
    return v.trim()||null;
  };
  const name=field('name',200);
  if(!name)throw new Error('INVALID');
  const cinValue=field('cin',30),cin=cinValue?normalizeCin(cinValue):cinValue;
  if(cin&&!validCin(cin))throw new Error('CIN');
  const email=field('email',254);
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('INVALID');
  const creditLimit=body.creditLimit===undefined?undefined:((typeof body.creditLimit==='string'||typeof body.creditLimit==='number')?Number(body.creditLimit):NaN);
  if(creditLimit!==undefined&&(!Number.isFinite(creditLimit)||creditLimit<0||creditLimit>1e12))throw new Error('INVALID');
  return {name,cin,address:field('address',1000),phone:field('phone',50),email,ice:field('ice',30),creditLimit};
}
