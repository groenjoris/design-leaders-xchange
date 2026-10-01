import { get, list } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

function authorized(request) {
  const key = process.env.EXPORT_KEY;
  const header = request.headers.get('authorization') ?? '';
  if (!key || !header.startsWith('Basic ')) return false;
  const password = Buffer.from(header.slice(6), 'base64').toString().split(':').slice(1).join(':');
  const a = Buffer.from(password);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

function csvCell(value) {
  const s = String(value ?? '');
  // Leading =, +, - or @ would be run as a formula when opened in Excel.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request) {
  if (!authorized(request)) {
    return new Response('Inloggen vereist', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Inschrijvingen"' },
    });
  }

  const rows = [];
  let cursor;
  do {
    const page = await list({ prefix: 'inschrijvingen/', cursor });
    const entries = await Promise.all(
      page.blobs.map(async (blob) => {
        const result = await get(blob.pathname, { access: 'private' });
        if (result?.statusCode !== 200) return null;
        return JSON.parse(await new Response(result.stream).text());
      }),
    );
    rows.push(...entries.filter(Boolean));
    cursor = page.cursor;
  } while (cursor);

  rows.sort((a, b) => a.aangemeld.localeCompare(b.aangemeld));
  const lines = [
    ['Aangemeld', 'Naam', 'Organisatie', 'E-mail', 'Taal'],
    ...rows.map((r) => [r.aangemeld, r.naam, r.organisatie, r.email, r.taal]),
  ].map((cells) => cells.map(csvCell).join(';'));

  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="inschrijvingen-voorlichting.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
