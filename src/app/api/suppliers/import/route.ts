import { importCatalog } from '@/lib/catalogImportServer';
export const dynamic = 'force-dynamic';
export async function POST(req:Request){return importCatalog(req,'suppliers');}
