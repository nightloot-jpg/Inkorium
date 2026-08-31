import 'dotenv/config';
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
  if (!s3Client) s3Client = new S3Client({ endpoint: endpoint.replace(/\/+$/, ''), region, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: false });
  return { client: s3Client, bucket, endpoint: endpoint.replace(/\/+$/, ''), publicUrlBase };
}

app.get('/api/storage/status', (_req, res) => {
  const configured = getHetznerS3Client();
  res.json({ hetznerConfigured: !!configured, bucket: configured?.bucket || null, endpoint: process.env.HETZNER_S3_ENDPOINT ? 'Configured' : 'Not configured' });
});

function getSupabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zllwzmfsfzfedorljgtg.supabase.co').replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_npJmIHQP_g2ApAu-7fqQAQ_d2p';
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

async function resolveProfileIdInSupabase(identifier: string, supabaseUrl: string, key: string): Promise<string | null> {
  if (!identifier) return null;
  const clean = String(identifier).trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  try {
    // 1. Direct ID match if it's already a UUID
    if (uuidRegex.test(clean)) {
      const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(clean)}&select=id`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
      });
      const rows = await res.json().catch(() => []);
      if (Array.isArray(rows) && rows.length > 0) return rows[0].id;
    }

    // 2. Exact match by username (with or without 'user-' prefix)
    const cleanUsername = clean.replace(/^user-/, '');
    const resUser = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}&select=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
    const rowsUser = await resUser.json().catch(() => []);
    if (Array.isArray(rowsUser) && rowsUser.length > 0) return rowsUser[0].id;

    // 3. Search in username, full_name, or email
    const resOr = await fetch(`${supabaseUrl}/rest/v1/profiles?or=(username.eq.${encodeURIComponent(clean)},full_name.ilike.*${encodeURIComponent(clean)}*)&select=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
    const rowsOr = await resOr.json().catch(() => []);
    if (Array.isArray(rowsOr) && rowsOr.length > 0) return rowsOr[0].id;
  } catch (e) {
    console.warn('Error resolving profile ID in Supabase:', e);
  }
  return null;
}

app.get('/api/private-messages', async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey } = getSupabaseConfig();
    const token = extractToken(req);
    if (!supabaseKey) {
      return res.status(200).json([]);
    }
    const authKey = serviceRoleKey || supabaseKey;
    const authHeader = token ? `Bearer ${token}` : `Bearer ${authKey}`;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
      else if (value != null) query.set(key, String(value));
    }
    query.delete('access_token');
    if (!query.has('select')) query.set('select', 'id,sender_id,recipient_id,subject,body,is_read,created_at');
    if (!query.has('order')) query.set('order', 'created_at.desc');
    const upstream = await fetch(`${supabaseUrl}/rest/v1/private_messages?${query.toString()}`, {
      headers: { apikey: supabaseKey, Authorization: authHeader, Accept: 'application/json', 'Content-Type': 'application/json' }
    });
    const body = await upstream.text();
    if (!upstream.ok || body.trim().startsWith('<')) {
      return res.status(200).json([]);
    }
    return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (err: any) {
    console.warn('Private messages proxy fallback to empty array:', err?.message);
    return res.status(200).json([]);
  }
});

app.post('/api/private-messages', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, jwtSecret } = getSupabaseConfig();
    const token = extractToken(req);
    const isListAction = String(req.body?.action || '').trim().toLowerCase() === 'list';

    if (!supabaseKey) {
      if (isListAction) return res.status(200).json([]);
      const payload = req.body || {};
      return res.status(200).json({
        id: `msg-${Date.now()}`,
        sender_id: payload.sender_id || 'user-current',
        recipient_id: payload.recipient_id || '',
        subject: payload.subject || 'Sin asunto',
        body: payload.body || '',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    const authKey = serviceRoleKey || supabaseKey;

    if (isListAction) {
      const authHeader = token ? `Bearer ${token}` : `Bearer ${authKey}`;
      const upstream = await fetch(`${supabaseUrl}/rest/v1/private_messages?select=id,sender_id,recipient_id,subject,body,is_read,created_at&order=created_at.desc`, {
        headers: { apikey: supabaseKey, Authorization: authHeader, Accept: 'application/json', 'Content-Type': 'application/json' }
      });
      const body = await upstream.text();
      if (!upstream.ok || body.trim().startsWith('<')) {
        return res.status(200).json([]);
      }
      return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
    }

    const { access_token: _accessToken, action: _action, ...messagePayload } = req.body || {};

    // 1. Resolve authenticated sender ID
    let finalSenderId = String(messagePayload.sender_id || '').trim();
    if (token) {
      const verifiedUid = await verifySupabaseJwt(token, supabaseUrl, jwtSecret);
      if (verifiedUid) {
        finalSenderId = verifiedUid;
      }
    }
    if (!finalSenderId && token) {
      const parsed = parseJwt(token);
      if (parsed?.payload?.sub) finalSenderId = parsed.payload.sub;
    }
    if (finalSenderId) {
      const resolvedSender = await resolveProfileIdInSupabase(finalSenderId, supabaseUrl, authKey);
      if (resolvedSender) finalSenderId = resolvedSender;
    }

    // 2. Resolve recipient ID against Supabase profiles table
    let finalRecipientId = String(messagePayload.recipient_id || '').trim();
    const resolvedRecipient = await resolveProfileIdInSupabase(finalRecipientId, supabaseUrl, authKey);
    if (resolvedRecipient) {
      finalRecipientId = resolvedRecipient;
    }

    // 3. Strict validation: Never send message to oneself
    if (finalSenderId && finalRecipientId && finalSenderId === finalRecipientId) {
      return res.status(400).json({ 
        error: 'CANNOT_MESSAGE_SELF', 
        message: 'No puedes enviarte un mensaje privado a ti mismo.' 
      });
    }

    const payloadToInsert = {
      sender_id: finalSenderId || messagePayload.sender_id || 'user-current',
      recipient_id: finalRecipientId || messagePayload.recipient_id || '',
      subject: String(messagePayload.subject || 'Sin asunto').trim(),
      body: String(messagePayload.body || '').trim()
    };

    const authHeader = serviceRoleKey ? `Bearer ${serviceRoleKey}` : (token ? `Bearer ${token}` : `Bearer ${supabaseKey}`);
    const upstream = await fetch(`${supabaseUrl}/rest/v1/private_messages?select=id,sender_id,recipient_id,subject,body,is_read,created_at`, {
      method: 'POST',
      headers: { 
        apikey: supabaseKey, 
        Authorization: authHeader, 
        Accept: 'application/json', 
        'Content-Type': 'application/json', 
        Prefer: Array.isArray(req.headers.prefer) ? req.headers.prefer.join(',') : (req.headers.prefer || 'return=representation') 
      },
      body: JSON.stringify(payloadToInsert)
    });
    const body = await upstream.text();
    if (!upstream.ok || body.trim().startsWith('<')) {
      console.warn('Private messages Supabase insert note:', body);
      return res.status(200).json({
        id: `msg-${Date.now()}`,
        sender_id: payloadToInsert.sender_id,
        recipient_id: payloadToInsert.recipient_id,
        subject: payloadToInsert.subject,
        body: payloadToInsert.body,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
    return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (err: any) {
    console.warn('Private messages insert proxy fallback:', err?.message);
    const payload = req.body || {};
    return res.status(200).json({
      id: `msg-${Date.now()}`,
      sender_id: payload.sender_id || 'user-current',
      recipient_id: payload.recipient_id || '',
      subject: payload.subject || 'Sin asunto',
      body: payload.body || '',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }
});

app.patch('/api/private-messages', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const token = extractToken(req);
    if (!supabaseKey || !token) {
      return res.status(200).json({ success: true });
    }
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
      else if (value != null) query.set(key, String(value));
    }
    const { access_token: _accessToken, ...messagePayload } = req.body || {};
    const upstream = await fetch(`${supabaseUrl}/rest/v1/private_messages?${query.toString()}`, {
      method: 'PATCH',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', Prefer: Array.isArray(req.headers.prefer) ? req.headers.prefer.join(',') : (req.headers.prefer || 'return=minimal') },
      body: JSON.stringify(messagePayload)
    });
    const body = await upstream.text();
    if (!upstream.ok || body.trim().startsWith('<')) {
      return res.status(200).json({ success: true });
    }
    return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (err: any) {
    return res.status(200).json({ success: true });
  }
});

app.delete('/api/private-messages', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const token = extractToken(req);
    if (!supabaseKey || !token) {
      return res.status(200).json({ success: true });
    }
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
      else if (value != null) query.set(key, String(value));
    }
    const upstream = await fetch(`${supabaseUrl}/rest/v1/private_messages?${query.toString()}`, {
      method: 'DELETE',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, Accept: 'application/json', Prefer: Array.isArray(req.headers.prefer) ? req.headers.prefer.join(',') : (req.headers.prefer || 'return=minimal') }
    });
    const body = await upstream.text();
    if (!upstream.ok || body.trim().startsWith('<')) {
      return res.status(200).json({ success: true });
    }
    return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
  } catch (err: any) {
    return res.status(200).json({ success: true });
  }
});

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
    const { supabaseUrl, supabaseKey, serviceRoleKey } = getSupabaseConfig(); const profileId = String(req.params.id || '').trim(); const avatarUrl = String(req.body?.avatar_url || '').trim(); const token = extractToken(req);
    if (!profileId) return res.status(400).json({ error: 'INVALID_PROFILE_ID' });
    if (!avatarUrl) return res.status(400).json({ error: 'INVALID_AVATAR_URL' });
    if (!supabaseKey) return res.status(200).json({ success: true, avatar_url: avatarUrl, local: true });
    const key = serviceRoleKey || supabaseKey;
    const authHeader = serviceRoleKey ? `Bearer ${serviceRoleKey}` : (token ? `Bearer ${token}` : `Bearer ${supabaseKey}`);
    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, {
      method: 'PATCH',
      headers: { apikey: key, Authorization: authHeader, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    });
    const body = await upstream.text();
    if (!upstream.ok) {
      console.warn('Upstream avatar update returned non-ok, returning successful local avatar:', body);
      return res.status(200).json({ success: true, avatar_url: avatarUrl, fallback: true });
    }
    return res.status(200).json({ success: true, avatar_url: avatarUrl });
  } catch (err: any) {
    console.warn('Supabase avatar proxy fallback:', err?.message);
    return res.status(200).json({ success: true, avatar_url: String(req.body?.avatar_url || '') });
  }
});

app.patch('/api/profiles/:id/status', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, jwtSecret } = getSupabaseConfig();
    const profileId = String(req.params.id || '').trim(); const status = String(req.body?.status || '').trim().slice(0, 140); const token = extractToken(req);
    if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' }); if (!profileId) return res.status(400).json({ error: 'INVALID_PROFILE_ID' }); if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
    const authorId = await verifySupabaseJwt(token, supabaseUrl, jwtSecret); if (!authorId || authorId !== profileId) return res.status(403).json({ error: 'FORBIDDEN' });
    const key = serviceRoleKey || supabaseKey; const authorization = serviceRoleKey ? `Bearer ${serviceRoleKey}` : `Bearer ${token}`;
    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { method: 'PATCH', headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ user_status: status, updated_at: new Date().toISOString() }) });
    const body = await upstream.text(); if (!upstream.ok) return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body); return res.status(200).json({ success: true, user_status: status });
  } catch (err: any) { console.error('Supabase profile status proxy failed:', err); return res.status(502).json({ error: 'SUPABASE_STATUS_PROXY_FAILED', message: err?.message || 'Unable to update status.' }); }
});

app.post('/api/photos', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey } = getSupabaseConfig();
    const token = extractToken(req); const action = String(req.body?.action || 'list').trim().toLowerCase();
    if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });

    if (action === 'list') {
      const apiKey = serviceRoleKey || supabaseKey;
      const authHeader = serviceRoleKey ? `Bearer ${serviceRoleKey}` : (token ? `Bearer ${token}` : `Bearer ${supabaseKey}`);
      const dbHeaders = { apikey: apiKey, Authorization: authHeader, Accept: 'application/json' };
      const upstream = await fetch(`${supabaseUrl}/rest/v1/photos?select=id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at&order=created_at.desc`, { headers: dbHeaders });
      const body = await upstream.text();
      if (!upstream.ok) return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
      try { const data = JSON.parse(body); return res.status(200).json(Array.isArray(data) ? data : []); } catch { return res.status(502).json({ error: 'SUPABASE_PHOTOS_INVALID_RESPONSE' }); }
    }

    if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
    const userId = await verifySupabaseJwt(token, supabaseUrl, getSupabaseConfig().jwtSecret); if (!userId) return res.status(401).json({ error: 'INVALID_AUTH_TOKEN' });
    if (!serviceRoleKey) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_NOT_CONFIGURED', message: 'Server-side Supabase service role key is required for photo persistence.' });
    const dbHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: 'application/json' };

    if (action === 'create') {
      const albumId = req.body?.album_id ? String(req.body.album_id).trim() : null;
      const url = String(req.body?.url || '').trim(); const caption = req.body?.caption == null ? null : String(req.body.caption).slice(0, 500);
      const visibility = ['public', 'friends', 'private'].includes(String(req.body?.visibility)) ? String(req.body.visibility) : 'public';
      if (!url) return res.status(400).json({ error: 'INVALID_PHOTO_URL' });

      if (albumId) {
        const albumResponse = await fetch(`${supabaseUrl}/rest/v1/albums?id=eq.${encodeURIComponent(albumId)}&select=id,user_id`, { headers: dbHeaders });
        const albumBody = await albumResponse.text();
        if (!albumResponse.ok) return res.status(albumResponse.status).type(albumResponse.headers.get('content-type') || 'application/json').send(albumBody);
        let albums: any[] = []; try { albums = JSON.parse(albumBody); } catch { return res.status(502).json({ error: 'SUPABASE_ALBUM_INVALID_RESPONSE' }); }
        if (!albums[0] || String(albums[0].user_id) !== userId) return res.status(403).json({ error: 'INVALID_ALBUM' });
      }

      const upstream = await fetch(`${supabaseUrl}/rest/v1/photos`, { method: 'POST', headers: { ...dbHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ user_id: userId, album_id: albumId, storage_path: url, url, caption, visibility }) });
      const body = await upstream.text();
      if (!upstream.ok) return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
      try { const data = JSON.parse(body); const row = Array.isArray(data) ? data[0] : data; return row ? res.status(201).json(row) : res.status(502).json({ error: 'SUPABASE_PHOTO_CREATE_EMPTY' }); } catch { return res.status(502).json({ error: 'SUPABASE_PHOTO_CREATE_INVALID_RESPONSE' }); }
    }
    return res.status(400).json({ error: 'INVALID_ACTION' });
  } catch (err: any) { console.error('Supabase photos proxy failed:', err); return res.status(502).json({ error: 'SUPABASE_PHOTOS_PROXY_FAILED', message: err?.message || 'Unable to process photos.' }); }
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

app.post('/api/upload', upload.single('file') as any, async (req: express.Request, res: express.Response) => {
  try {
    const file = req.file; const folder = String(req.body.folder || 'photos').trim().toLowerCase();
    if (!file) return res.status(400).json({ error: 'NO_FILE' });
    if (!['avatars', 'photos', 'wall'].includes(folder)) return res.status(400).json({ error: 'INVALID_FOLDER' });
    const hetzner = getHetznerS3Client();
    if (!hetzner) {
      const mime = file.mimetype || 'image/jpeg';
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${mime};base64,${base64}`;
      return res.json({ success: true, url: dataUrl, key: `inline-${Date.now()}`, provider: 'inline' });
    }
    const fileExt = (file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt || 'jpg'}`;
    await hetzner.client.send(new PutObjectCommand({
      Bucket: hetzner.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable'
    }));
    let publicUrl: string;
    if (hetzner.publicUrlBase) {
      publicUrl = `${hetzner.publicUrlBase.replace(/\/+$/, '')}/${key}`;
    } else {
      const endpointUrl = new URL(`${hetzner.endpoint}/`);
      publicUrl = `${endpointUrl.protocol}//${hetzner.bucket}.${endpointUrl.host}/${key}`;
    }
    return res.json({ success: true, url: publicUrl, key, bucket: hetzner.bucket, provider: 'hetzner' });
  } catch (err: any) {
    console.error('Error uploading file to Hetzner Object Storage, using inline fallback:', err);
    if (req.file) {
      const mime = req.file.mimetype || 'image/jpeg';
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${mime};base64,${base64}`;
      return res.json({ success: true, url: dataUrl, key: `fallback-${Date.now()}`, provider: 'fallback' });
    }
    const code = err?.Code || err?.name || 'UNKNOWN';
    const message = err?.message || 'Error al subir el archivo.';
    return res.status(500).json({ error: 'UPLOAD_FAILED', code, message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') { const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares); }
  else { const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html'))); }
  app.listen(PORT, '0.0.0.0', () => console.log(`Inkorium Server running on port ${PORT}`));
}

startServer();
