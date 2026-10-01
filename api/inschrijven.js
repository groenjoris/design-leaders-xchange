import { put } from '@vercel/blob';
import { createHash } from 'node:crypto';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = 200;

function json(status, body) {
  return Response.json(body, { status });
}

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: 'Ongeldige aanvraag.' });
  }

  // Honeypot: real visitors never see or fill this field.
  if (data.website) return json(200, { ok: true });

  const email = String(data.email ?? '').trim().toLowerCase();
  const naam = String(data.naam ?? '').trim();
  const organisatie = String(data.organisatie ?? '').trim();

  if (!naam || !organisatie || !EMAIL.test(email)) {
    return json(400, { error: 'Vul je naam, organisatie en een geldig e-mailadres in.' });
  }
  if (email.length > MAX || naam.length > MAX || organisatie.length > MAX) {
    return json(400, { error: 'Een van de velden is te lang.' });
  }

  // One file per e-mail address, so signing up twice updates instead of duplicating.
  const id = createHash('sha256').update(email).digest('hex').slice(0, 32);
  await put(
    `inschrijvingen/${id}.json`,
    JSON.stringify({ email, naam, organisatie, aangemeld: new Date().toISOString(), taal: data.taal === 'en' ? 'en' : 'nl' }),
    { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true },
  );

  return json(200, { ok: true });
}
