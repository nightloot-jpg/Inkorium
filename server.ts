import express from 'express';
import path from 'path';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createServer as createViteServer } from 'vite';
import { createHmac, createPublicKey, createVerify, timingSafeEqual } from 'node:crypto';

const app = express();
const PORT = 3000;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
let s3Client: S3Client | null = null;
let jwksCache: { expiresAt: number; keys: any[] } | null = null;

function getHetznerS3Client(): { client: S3Client; bucket: string; endpoint: string; publicUrlBase?: string } | null {
  const endpoint = process.env.HETZNER_S3_ENDPOINT;
  const accessKeyId = process.env.HETZNER_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.HETZNER_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.HETZNER_S3_BUCKET || 'inkorium-media';
  const region = process.env.HETZNER_S3_REGION || 'hel1';
  const publicUrlBase = process.env.HETZNER_S3_PUBLIC_URL;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  if (!s3Client) s3Client = new S3Client({ endpoint, region, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });
  return { client: s3Client, bucket, endpoint, publicUrlBase };
}

app.get('/api/storage/status', (_req, res) => {
  const configured = getHetznerS3Client();
  res.json({ hetznerConfigured: !!configured, bucket: configured?.bucket || null, endpoint: process.env.HETZNER_S3_ENDPOINT ? 'Configured' : 'Not configured' });
});

function getSupabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zllwzmfsfzfedorljgtg.supabase.co').replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';
  return { supabaseUrl, supabaseKey, serviceRoleKey, jwtSecret };
}

function extractToken(req: express.Request): string {
  const authorization = String(req.headers.authorization || '').trim();
  const headerToken = authorization.replace(/^Bearer\s+/i, '').trim();
  if (headerToken) return headerToken;
  return String(req.body?.access_token || '').trim();
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(normalized, 'base64');
}

function parseJwt(token: string): { header: any; payload: any; signature: Buffer; signingInput: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return { header: JSON.parse(base64UrlDecode(parts[0]).toString('utf8')), payload: JSON.parse(base64UrlDecode(parts[1]).toString('utf8')), signature: base64UrlDecode(parts[2]), signingInput: `${parts[0]}.${parts[1]}` };
  } catch { return null; }
}

function derEncodeEcdsaSignature(raw: Buffer): Buffer {
  if (raw.length !== 64) throw new Error('INVALID_ECDSA_SIGNATURE');
  const toInt = (value: Buffer) => { let i = 0; while (i < value.length - 1 && value[i] === 0) i++; let out = value.subarray(i); if (out[0] & 0x80) out = Buffer.concat([Buffer.from([0]), out]); return out; };
  const r = toInt(raw.subarray(0, 32)); const s = toInt(raw.subarray(32));
  const body = Buffer.concat([Buffer.from([0x02, r.length]), r, Buffer.from([0x02, s.length]), s]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

async function getJwks(supabaseUrl: string): Promise<any[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`JWKS_FETCH_FAILED_${response.status}`);
  const data = await response.json();
  const keys = Array.isArray(data?.keys) ? data.keys : [];
  jwksCache = { expiresAt: Date.now() + 10 * 60 * 1000, keys };
  return keys;
}

async function verifySupabaseJwt(token: string, supabaseUrl: string, jwtSecret: string): Promise<string | null> {
  const parsed = parseJwt(token);
  if (!parsed || typeof parsed.payload?.sub !== 'string') return null;
  const { header, payload, signature, signingInput } = parsed;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && Number(payload.exp) < now) return null;
  if (payload.iss && payload.iss !== `${supabaseUrl}/auth/v1`) return null;
  if (header.alg === 'HS256') {
    if (!jwtSecret) return null;
    const expected = createHmac('sha256', jwtSecret).update(signingInput).digest();
    if (expected.length !== signature.length || !timingSafeEqual(expected, signature)) return null;
    return payload.sub;
  }
  if (header.alg !== 'RS256' && header.alg !== 'ES256') return null;
  const keys = await getJwks(supabaseUrl);
  const jwk = keys.find((key: any) => !header.kid || key.kid === header.kid);
  if (!jwk) return null;
  const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  const verifier = createVerify('SHA256');
  verifier.update(signingInput); verifier.end();
  const verificationSignature = header.alg === 'ES256' ? derEncodeEcdsaSignature(signature) : signature;
  return verifier.verify(publicKey, verificationSignature) ? payload.sub : null;
}

function formatFeedDate(value: string): string {
  const date = new Date(value); if (Number.isNaN(date.getTime())) return value;
  const now = new Date(); const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMs / 3600000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  if (diffMinutes < 1) return 'Ahora mismo'; if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (date >= startOfToday && diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (date >= startOfYesterday && date < startOfToday) return 'Ayer';
  if (diffMs < 7 * 86400000) { const days = Math.floor(diffMs / 86400000); return `Hace ${days} ${days === 1 ? 'día' : 'días'}`; }
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function normalizePostDates(data: unknown) { return Array.isArray(data) ? data.map((row: any) => ({ ...row, created_at: formatFeedDate(String(row.created_at || '')) })) : data; }

app.get('/api/profiles', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig(); if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    const query = new URLSearchParams(); for (const [key, value] of Object.entries(req.query)) { if (Array.isArray(value)) value.forEach(item => query.append(key, String(item))); else if (value != null) query.set(key, String(value)); }
    if (!query.has('select')) query.set('select', 'id,username,full_name,avatar_url,city,birth_date,user_status,profile_interests,updated_at'); if (!query.has('limit')) query.set('limit', '1000');
    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?${query.toString()}`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' } }); const body = await upstream.text();
    return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (err: any) { console.error('Supabase profiles proxy failed:', err); return res.status(502).json({ error: 'SUPABASE_PROXY_FAILED', message: err?.message || 'Unable to load profiles.' }); }
});

app.patch('/api/profiles/:id/presence', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig(); const profileId = String(req.params.id || '').trim(); const presence = String(req.body?.presence || '').trim().toLowerCase(); const token = extractToken(req);
    if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' }); if (!profileId || !['conectado','ausente','ocupado','invisible'].includes(presence)) return res.status(400).json({ error: 'INVALID_PRESENCE' }); if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { method: 'PATCH', headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ presence }) });
    if (!upstream.ok) return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(await upstream.text()); return res.status(204).end();
  } catch (err: any) { console.error('Supabase presence proxy failed:', err); return res.status(502).json({ error: 'SUPABASE_PRESENCE_PROXY_FAILED', message: err?.message || 'Unable to update presence.' }); }
});

app.patch('/api/profiles/:id/avatar', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig(); const profileId = String(req.params.id || '').trim(); const avatarUrl = String(req.body?.avatar_url || '').trim(); const token = extractToken(req);
    if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' }); if (!profileId) return res.status(400).json({ error: 'INVALID_PROFILE_ID' }); if (!avatarUrl || !/^https?:\/\//i.test(avatarUrl)) return res.status(400).json({ error: 'INVALID_AVATAR_URL' }); if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { method: 'PATCH', headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }) });
    const body = await upstream.text(); if (!upstream.ok) return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body); return res.status(200).json({ success: true, avatar_url: avatarUrl });
  } catch (err: any) { console.error('Supabase avatar proxy failed:', err); return res.status(502).json({ error: 'SUPABASE_AVATAR_PROXY_FAILED', message: err?.message || 'Unable to update avatar.' }); }
});

app.get('/api/posts', async (_req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey } = getSupabaseConfig(); const key = serviceRoleKey || supabaseKey; if (!key) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    const upstream = await fetch(`${supabaseUrl}/rest/v1/posts?select=id,author_id,content,visibility,media_data,created_at,updated_at&order=created_at.desc&limit=100`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } });
    const body = await upstream.text(); if (!upstream.ok) return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body); try { return res.status(200).json(normalizePostDates(JSON.parse(body))); } catch { return res.status(502).json({ error: 'SUPABASE_POSTS_INVALID_RESPONSE' }); }
  } catch (err: any) { console.error('Supabase posts proxy failed:', err); return res.status(502).json({ error: 'SUPABASE_POSTS_PROXY_FAILED', message: err?.message || 'Unable to load posts.' }); }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, jwtSecret } = getSupabaseConfig(); const content = String(req.body?.content || '').trim(); const mediaUrl = req.body?.media_url ? String(req.body.media_url).trim() : null; const token = extractToken(req);
    if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' }); if (!serviceRoleKey) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_NOT_CONFIGURED', message: 'Server-side Supabase service role key is not configured.' });
    if (!content && !mediaUrl) return res.status(400).json({ error: 'EMPTY_POST' }); if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
    const authorId = await verifySupabaseJwt(token, supabaseUrl, jwtSecret); if (!authorId) return res.status(401).json({ error: 'INVALID_AUTH_TOKEN' });
    const insert = await fetch(`${supabaseUrl}/rest/v1/posts`, { method: 'POST', headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ author_id: authorId, content, visibility: 'public', media_data: mediaUrl ? { url: mediaUrl } : null }) });
    const body = await insert.text(); if (!insert.ok) return res.status(insert.status).type(insert.headers.get('content-type') || 'application/json').send(body);
    try { const rows = JSON.parse(body); const row = Array.isArray(rows) ? rows[0] : rows; return res.status(201).json(row ? { ...row, created_at: formatFeedDate(String(row.created_at || '')) } : row); } catch { return res.status(502).json({ error: 'SUPABASE_POST_CREATE_INVALID_RESPONSE' }); }
  } catch (err: any) { console.error('Supabase create post failed:', err); return res.status(502).json({ error: 'SUPABASE_POST_CREATE_FAILED', message: err?.message || 'Unable to create post.' }); }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file; const folder = String(req.body.folder || 'photos'); if (!file) return res.status(400).json({ error: 'NO_FILE' }); const hetzner = getHetznerS3Client();
    if (!hetzner) return res.status(503).json({ error: 'HETZNER_STORAGE_NOT_CONFIGURED', message: 'Hetzner S3 Object Storage credentials are not set in environment.' });
    const fileExt = file.originalname.split('.').pop() || 'jpg'; const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    await hetzner.client.send(new PutObjectCommand({ Bucket: hetzner.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype || 'image/jpeg', ACL: 'public-read' }));
    const publicUrl = hetzner.publicUrlBase ? `${hetzner.publicUrlBase.replace(/\/+$/, '')}/${key}` : `${hetzner.endpoint.replace(/\/+$/, '')}/${hetzner.bucket}/${key}`;
    return res.json({ success: true, url: publicUrl, key, bucket: hetzner.bucket, provider: 'hetzner' });
  } catch (err: any) { console.error('Error uploading file to Hetzner Object Storage:', err); return res.status(500).json({ error: 'UPLOAD_FAILED', message: err?.message || 'Error al subir el archivo.' }); }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') { const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares); }
  else { const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html'))); }
  app.listen(PORT, '0.0.0.0', () => console.log(`Inkorium Server running on port ${PORT}`));
}

startServer();
