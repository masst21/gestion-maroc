import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const endpoint = 'https://api.frankfurter.dev/v2/providers/BAM/rates?base=MAD';

export async function GET() {
  try {
    const response = await fetch(endpoint, { next: { revalidate: 900 }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Provider unavailable');
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid response');
    const rates = new Map<string, { code: string; rate: number; date: string }>();
    for (const row of data) {
      if (!row || row.base !== 'MAD' || typeof row.quote !== 'string' || !/^[A-Z]{3}$/.test(row.quote) ||
          row.quote === 'MAD' || typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate <= 0 ||
          typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) continue;
      const rate = 1 / row.rate;
      if (!Number.isFinite(rate)) continue;
      const previous = rates.get(row.quote);
      if (!previous || previous.date < row.date) rates.set(row.quote, { code: row.quote, rate, date: row.date });
    }
    if (rates.size < 2 || !rates.has('EUR') || !rates.has('USD')) throw new Error('Incomplete reference data');
    return NextResponse.json({ source: 'Bank Al-Maghrib', provider: 'Frankfurter', rates: [...rates.values()] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Reference rates unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
