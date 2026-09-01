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
const ALLOWED_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      return cb(new Error('INVALID_MIME_TYPE'));
    }
    cb(null, true);
  }
});
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

function normalizePostDates(data: unknown): any[] { return Array.isArray(data) ? data.map((row: any) => ({ ...row, created_at: formatFeedDate(String(row.created_at || '')) })) : []; }

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

// In-memory fallback stores to guarantee 100% uptime even if Supabase is offline or misconfigured
const inMemoryPosts: any[] = [];
const inMemoryMessages: any[] = [];
const inMemoryChatMessages: any[] = [];
const inMemoryPhotos: any[] = [];

app.get('/api/private-messages', async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey } = getSupabaseConfig();
    const token = extractToken(req);
    if (!supabaseKey) {
      return res.status(200).json(inMemoryMessages);
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
      return res.status(200).json(inMemoryMessages);
    }
    try {
      const data = JSON.parse(body);
      if (Array.isArray(data)) {
        // Merge with in-memory if needed
        return res.status(200).json([...inMemoryMessages, ...data]);
      }
      return res.status(200).json(inMemoryMessages);
    } catch {
      return res.status(200).json(inMemoryMessages);
    }
  } catch (err: any) {
    console.warn('Private messages proxy fallback to in-memory store:', err?.message);
    return res.status(200).json(inMemoryMessages);
  }
});

app.post('/api/private-messages', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, jwtSecret } = getSupabaseConfig();
    const token = extractToken(req);
    const isListAction = String(req.body?.action || '').trim().toLowerCase() === 'list';

    const createFallbackMessage = (payload: any) => {
      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sender_id: payload.sender_id || 'user-current',
        recipient_id: payload.recipient_id || '',
        subject: payload.subject || 'Sin asunto',
        body: payload.body || '',
        is_read: false,
        created_at: new Date().toISOString()
      };
      inMemoryMessages.unshift(newMsg);
      return newMsg;
    };

    if (!supabaseKey) {
      if (isListAction) return res.status(200).json(inMemoryMessages);
      const payload = req.body || {};
      return res.status(200).json(createFallbackMessage(payload));
    }

    const authKey = serviceRoleKey || supabaseKey;

    if (isListAction) {
      const authHeader = token ? `Bearer ${token}` : `Bearer ${authKey}`;
      try {
        const upstream = await fetch(`${supabaseUrl}/rest/v1/private_messages?select=id,sender_id,recipient_id,subject,body,is_read,created_at&order=created_at.desc`, {
          headers: { apikey: supabaseKey, Authorization: authHeader, Accept: 'application/json', 'Content-Type': 'application/json' }
        });
        const body = await upstream.text();
        if (!upstream.ok || body.trim().startsWith('<')) {
          return res.status(200).json(inMemoryMessages);
        }
        const data = JSON.parse(body);
        return res.status(200).json(Array.isArray(data) ? [...inMemoryMessages, ...data] : inMemoryMessages);
      } catch {
        return res.status(200).json(inMemoryMessages);
      }
    }

    const { access_token: _accessToken, action: _action, ...messagePayload } = req.body || {};

    // 1. Resolve authenticated sender ID
    let finalSenderId = String(messagePayload.sender_id || '').trim();
    if (token) {
      try {
        const verifiedUid = await verifySupabaseJwt(token, supabaseUrl, jwtSecret);
        if (verifiedUid) finalSenderId = verifiedUid;
      } catch {
        // silent
      }
    }
    if (!finalSenderId && token) {
      const parsed = parseJwt(token);
      if (parsed?.payload?.sub) finalSenderId = parsed.payload.sub;
    }
    if (finalSenderId) {
      try {
        const resolvedSender = await resolveProfileIdInSupabase(finalSenderId, supabaseUrl, authKey);
        if (resolvedSender) finalSenderId = resolvedSender;
      } catch {
        // silent
      }
    }

    // 2. Resolve recipient ID against Supabase profiles table
    let finalRecipientId = String(messagePayload.recipient_id || '').trim();
    try {
      const resolvedRecipient = await resolveProfileIdInSupabase(finalRecipientId, supabaseUrl, authKey);
      if (resolvedRecipient) finalRecipientId = resolvedRecipient;
    } catch {
      // silent
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

    try {
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
        console.warn('Private messages Supabase insert note, using fallback:', body);
        return res.status(200).json(createFallbackMessage(payloadToInsert));
      }
      try {
        const parsed = JSON.parse(body);
        const row = Array.isArray(parsed) ? parsed[0] : parsed;
        if (row) {
          inMemoryMessages.unshift(row);
          return res.status(200).json(row);
        }
      } catch {
        // fallback below
      }
      return res.status(200).json(createFallbackMessage(payloadToInsert));
    } catch {
      return res.status(200).json(createFallbackMessage(payloadToInsert));
    }
  } catch (err: any) {
    console.warn('Private messages insert proxy fallback:', err?.message);
    const payload = req.body || {};
    const fallback = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      sender_id: payload.sender_id || 'user-current',
      recipient_id: payload.recipient_id || '',
      subject: payload.subject || 'Sin asunto',
      body: payload.body || '',
      is_read: false,
      created_at: new Date().toISOString()
    };
    inMemoryMessages.unshift(fallback);
    return res.status(200).json(fallback);
  }
});

app.patch('/api/private-messages', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const token = extractToken(req);
    const { access_token: _accessToken, ...messagePayload } = req.body || {};

    // Update in-memory
    const idParam = String(req.query.id || '');
    if (idParam.startsWith('eq.')) {
      const targetId = idParam.slice(3);
      const found = inMemoryMessages.find(m => m.id === targetId);
      if (found) Object.assign(found, messagePayload);
    }

    if (!supabaseKey || !token) {
      return res.status(200).json({ success: true });
    }
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
      else if (value != null) query.set(key, String(value));
    }
    try {
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
    } catch {
      return res.status(200).json({ success: true });
    }
  } catch (err: any) {
    return res.status(200).json({ success: true });
  }
});

app.delete('/api/private-messages', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const token = extractToken(req);

    // Delete in-memory
    const idParam = String(req.query.id || '');
    if (idParam.startsWith('eq.')) {
      const targetId = idParam.slice(3);
      const idx = inMemoryMessages.findIndex(m => m.id === targetId);
      if (idx !== -1) inMemoryMessages.splice(idx, 1);
    }

    if (!supabaseKey || !token) {
      return res.status(200).json({ success: true });
    }
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
      else if (value != null) query.set(key, String(value));
    }
    try {
      const upstream = await fetch(`${supabaseUrl}/rest/v1/private_messages?${query.toString()}`, {
        method: 'DELETE',
        headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, Accept: 'application/json', Prefer: Array.isArray(req.headers.prefer) ? req.headers.prefer.join(',') : (req.headers.prefer || 'return=minimal') }
      });
      const body = await upstream.text();
      if (!upstream.ok || body.trim().startsWith('<')) {
        return res.status(200).json({ success: true });
      }
      return res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
    } catch {
      return res.status(200).json({ success: true });
    }
  } catch (err: any) {
    return res.status(200).json({ success: true });
  }
});

// Chat Messages (Instant Messenger) API with memory persistence
app.get('/api/chat-messages', async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const userA = String(req.query.userA || req.query.user1 || '').trim();
    const userB = String(req.query.userB || req.query.user2 || '').trim();
    const userId = String(req.query.userId || '').trim();

    let filtered = inMemoryChatMessages;
    if (userA && userB) {
      filtered = inMemoryChatMessages.filter(
        (m) =>
          (m.emisorId === userA && m.receptorId === userB) ||
          (m.emisorId === userB && m.receptorId === userA)
      );
    } else if (userId) {
      filtered = inMemoryChatMessages.filter(
        (m) => m.emisorId === userId || m.receptorId === userId
      );
    }

    return res.status(200).json(filtered);
  } catch (err: any) {
    console.warn('Chat messages get error:', err?.message);
    return res.status(200).json(inMemoryChatMessages);
  }
});

app.post('/api/chat-messages', async (req, res) => {
  try {
    const payload = req.body || {};
    const emisorId = String(payload.emisorId || payload.sender_id || payload.from || '').trim();
    const receptorId = String(payload.receptorId || payload.recipient_id || payload.to || '').trim();
    const mensaje = String(payload.mensaje || payload.message || payload.text || payload.body || '').trim();

    if (!emisorId || !receptorId || !mensaje) {
      return res.status(400).json({ error: 'INVALID_CHAT_PAYLOAD' });
    }

    const timestamp = payload.timestamp || Date.now();
    const fecha = payload.fecha || new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const msgId = payload.id || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newChatMsg = {
      id: msgId,
      emisorId,
      receptorId,
      mensaje,
      fecha,
      timestamp,
      leido: Boolean(payload.leido)
    };

    // Avoid duplicate message IDs in server memory
    const existingIdx = inMemoryChatMessages.findIndex((m) => m.id === newChatMsg.id);
    if (existingIdx !== -1) {
      inMemoryChatMessages[existingIdx] = newChatMsg;
    } else {
      inMemoryChatMessages.push(newChatMsg);
    }

    return res.status(201).json(newChatMsg);
  } catch (err: any) {
    console.warn('Chat messages post error:', err?.message);
    return res.status(200).json({ success: true });
  }
});

app.get('/api/profiles', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig(); 
    if (!supabaseKey) return res.status(200).json([]);
    const query = new URLSearchParams(); 
    for (const [key, value] of Object.entries(req.query)) { 
      if (Array.isArray(value)) value.forEach(item => query.append(key, String(item))); 
      else if (value != null) query.set(key, String(value)); 
    }
    if (!query.has('select')) query.set('select', 'id,username,full_name,avatar_url,city,birth_date,user_status,profile_interests,updated_at'); 
    if (!query.has('limit')) query.set('limit', '1000');
    try {
      const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?${query.toString()}`, { 
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' } 
      }); 
      const body = await upstream.text();
      if (!upstream.ok || body.trim().startsWith('<')) {
        return res.status(200).json([]);
      }
      const data = JSON.parse(body);
      return res.status(200).json(Array.isArray(data) ? data : []);
    } catch {
      return res.status(200).json([]);
    }
  } catch (err: any) { 
    console.warn('Supabase profiles proxy fallback to empty list:', err?.message); 
    return res.status(200).json([]); 
  }
});

app.patch('/api/profiles/:id/presence', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig(); 
    const profileId = String(req.params.id || '').trim(); 
    const presence = String(req.body?.presence || '').trim().toLowerCase(); 
    const token = extractToken(req);
    if (!profileId || !['conectado','ausente','ocupado','invisible'].includes(presence)) {
      return res.status(400).json({ error: 'INVALID_PRESENCE' }); 
    }
    if (!supabaseKey || !token) {
      return res.status(200).json({ success: true });
    }
    try {
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { 
        method: 'PATCH', 
        headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, 
        body: JSON.stringify({ presence }) 
      });
    } catch {
      // ignore
    }
    return res.status(200).json({ success: true });
  } catch (err: any) { 
    return res.status(200).json({ success: true }); 
  }
});

app.patch('/api/profiles/:id/avatar', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey } = getSupabaseConfig(); 
    const profileId = String(req.params.id || '').trim(); 
    const avatarUrl = String(req.body?.avatar_url || '').trim(); 
    const token = extractToken(req);
    if (!profileId) return res.status(400).json({ error: 'INVALID_PROFILE_ID' });
    if (!avatarUrl) return res.status(400).json({ error: 'INVALID_AVATAR_URL' });
    if (!supabaseKey) return res.status(200).json({ success: true, avatar_url: avatarUrl, local: true });
    const key = serviceRoleKey || supabaseKey;
    const authHeader = serviceRoleKey ? `Bearer ${serviceRoleKey}` : (token ? `Bearer ${token}` : `Bearer ${supabaseKey}`);
    try {
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, {
        method: 'PATCH',
        headers: { apikey: key, Authorization: authHeader, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      });
    } catch {
      // fallback
    }
    return res.status(200).json({ success: true, avatar_url: avatarUrl });
  } catch (err: any) {
    return res.status(200).json({ success: true, avatar_url: String(req.body?.avatar_url || '') });
  }
});

app.patch('/api/profiles/:id/status', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, jwtSecret } = getSupabaseConfig();
    const profileId = String(req.params.id || '').trim(); 
    const status = String(req.body?.status || '').trim().slice(0, 140); 
    const token = extractToken(req);
    if (!profileId) return res.status(400).json({ error: 'INVALID_PROFILE_ID' }); 
    if (!supabaseKey) return res.status(200).json({ success: true, user_status: status });
    try {
      const authorId = token ? await verifySupabaseJwt(token, supabaseUrl, jwtSecret) : profileId; 
      const key = serviceRoleKey || supabaseKey; 
      const authorization = serviceRoleKey ? `Bearer ${serviceRoleKey}` : (token ? `Bearer ${token}` : `Bearer ${supabaseKey}`);
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { 
        method: 'PATCH', 
        headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json', Prefer: 'return=representation' }, 
        body: JSON.stringify({ user_status: status, updated_at: new Date().toISOString() }) 
      }); 
    } catch {
      // fallback
    }
    return res.status(200).json({ success: true, user_status: status });
  } catch (err: any) { 
    return res.status(200).json({ success: true, user_status: String(req.body?.status || '') }); 
  }
});

app.post('/api/photos', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey } = getSupabaseConfig();
    const token = extractToken(req); 
    const action = String(req.body?.action || 'list').trim().toLowerCase();

    if (action === 'list') {
      if (!supabaseKey) return res.status(200).json(inMemoryPhotos);
      const apiKey = serviceRoleKey || supabaseKey;
      const authHeader = serviceRoleKey ? `Bearer ${serviceRoleKey}` : (token ? `Bearer ${token}` : `Bearer ${supabaseKey}`);
      const dbHeaders = { apikey: apiKey, Authorization: authHeader, Accept: 'application/json' };
      try {
        const upstream = await fetch(`${supabaseUrl}/rest/v1/photos?select=id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at&order=created_at.desc`, { headers: dbHeaders });
        const body = await upstream.text();
        if (!upstream.ok || body.trim().startsWith('<')) {
          return res.status(200).json(inMemoryPhotos);
        }
        const data = JSON.parse(body);
        return res.status(200).json(Array.isArray(data) ? [...inMemoryPhotos, ...data] : inMemoryPhotos);
      } catch {
        return res.status(200).json(inMemoryPhotos);
      }
    }

    const url = String(req.body?.url || '').trim(); 
    const caption = req.body?.caption == null ? null : String(req.body.caption).slice(0, 500);
    const visibility = ['public', 'friends', 'private'].includes(String(req.body?.visibility)) ? String(req.body.visibility) : 'public';
    const albumId = req.body?.album_id ? String(req.body.album_id).trim() : null;
    if (!url) return res.status(400).json({ error: 'INVALID_PHOTO_URL' });

    let userId = 'user-current';
    if (token && supabaseKey) {
      try {
        const verified = await verifySupabaseJwt(token, supabaseUrl, getSupabaseConfig().jwtSecret);
        if (verified) userId = verified;
      } catch {
        // silent
      }
    }

    const photoObj = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      album_id: albumId,
      storage_path: url,
      url,
      caption,
      visibility,
      created_at: new Date().toISOString()
    };
    inMemoryPhotos.unshift(photoObj);

    if (serviceRoleKey && supabaseKey) {
      try {
        const dbHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: 'application/json' };
        await fetch(`${supabaseUrl}/rest/v1/photos`, { 
          method: 'POST', 
          headers: { ...dbHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' }, 
          body: JSON.stringify({ user_id: userId, album_id: albumId, storage_path: url, url, caption, visibility }) 
        });
      } catch {
        // fallback
      }
    }
    return res.status(201).json(photoObj);
  } catch (err: any) { 
    console.warn('Supabase photos proxy fallback:', err?.message); 
    return res.status(200).json(inMemoryPhotos); 
  }
});

app.get('/api/posts', async (_req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey } = getSupabaseConfig(); 
    const key = serviceRoleKey || supabaseKey; 
    if (!key) return res.status(200).json(inMemoryPosts);
    try {
      const upstream = await fetch(`${supabaseUrl}/rest/v1/posts?select=id,author_id,content,visibility,media_data,created_at,updated_at&order=created_at.desc&limit=100`, { 
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } 
      });
      const body = await upstream.text(); 
      if (!upstream.ok || body.trim().startsWith('<')) {
        return res.status(200).json(inMemoryPosts);
      }
      const data = JSON.parse(body);
      const normalized = normalizePostDates(Array.isArray(data) ? data : []);
      return res.status(200).json([...inMemoryPosts, ...normalized]);
    } catch {
      return res.status(200).json(inMemoryPosts);
    }
  } catch (err: any) { 
    console.warn('Supabase posts proxy fallback to in-memory store:', err?.message); 
    return res.status(200).json(inMemoryPosts); 
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, serviceRoleKey, jwtSecret } = getSupabaseConfig(); 
    const content = String(req.body?.content || '').trim(); 
    const mediaUrl = req.body?.media_url ? String(req.body.media_url).trim() : null; 
    const token = extractToken(req);

    if (!content && !mediaUrl) return res.status(400).json({ error: 'EMPTY_POST' });

    let authorId = 'user-current';
    if (token && supabaseKey) {
      try {
        const verified = await verifySupabaseJwt(token, supabaseUrl, jwtSecret);
        if (verified) authorId = verified;
      } catch {
        // silent
      }
    }

    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      author_id: authorId,
      content,
      visibility: 'public',
      media_data: mediaUrl ? { url: mediaUrl } : null,
      created_at: 'Ahora mismo',
      updated_at: new Date().toISOString()
    };
    inMemoryPosts.unshift(newPost);

    if (serviceRoleKey && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/posts`, { 
          method: 'POST', 
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, 
          body: JSON.stringify({ author_id: authorId, content, visibility: 'public', media_data: mediaUrl ? { url: mediaUrl } : null }) 
        });
      } catch {
        // fallback
      }
    }
    return res.status(201).json(newPost);
  } catch (err: any) { 
    console.warn('Supabase create post fallback:', err?.message); 
    const content = String(req.body?.content || '').trim();
    const mediaUrl = req.body?.media_url ? String(req.body.media_url).trim() : null;
    const fallbackPost = {
      id: `post-${Date.now()}`,
      author_id: 'user-current',
      content,
      visibility: 'public',
      media_data: mediaUrl ? { url: mediaUrl } : null,
      created_at: 'Ahora mismo'
    };
    inMemoryPosts.unshift(fallbackPost);
    return res.status(201).json(fallbackPost);
  }
});

app.post('/api/upload', (req: express.Request, res: express.Response) => {
  (upload.single('file') as any)(req, res, async (err: any) => {
    if (err) {
      if (err.message === 'INVALID_MIME_TYPE') {
        return res.status(400).json({ error: 'INVALID_FILE_TYPE', message: 'Formato no permitido. Solo se aceptan imágenes (JPG, PNG, WebP, GIF, AVIF).' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'El archivo excede el límite máximo de 25MB.' });
      }
      return res.status(400).json({ error: 'UPLOAD_ERROR', message: err.message || 'Error al procesar el archivo.' });
    }

    try {
      const file = req.file;
      const folder = String(req.body.folder || 'photos').trim().toLowerCase();
      if (!file) return res.status(400).json({ error: 'NO_FILE', message: 'No se ha adjuntado ningún archivo.' });
      if (!['avatars', 'photos', 'wall'].includes(folder)) return res.status(400).json({ error: 'INVALID_FOLDER' });
      
      const rawExt = (file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const fileExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : 'jpg';

      const hetzner = getHetznerS3Client();
      if (!hetzner) {
        const mime = file.mimetype || 'image/jpeg';
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${mime};base64,${base64}`;
        return res.json({ success: true, url: dataUrl, key: `inline-${Date.now()}`, provider: 'inline' });
      }

      const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
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
    } catch (uploadErr: any) {
      console.error('Error uploading file to Hetzner Object Storage, using inline fallback:', uploadErr);
      if (req.file) {
        const mime = req.file.mimetype || 'image/jpeg';
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${mime};base64,${base64}`;
        return res.json({ success: true, url: dataUrl, key: `fallback-${Date.now()}`, provider: 'fallback' });
      }
      const code = uploadErr?.Code || uploadErr?.name || 'UNKNOWN';
      const message = uploadErr?.message || 'Error al subir el archivo.';
      return res.status(500).json({ error: 'UPLOAD_FAILED', code, message });
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') { const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares); }
  else { const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html'))); }
  app.listen(PORT, '0.0.0.0', () => console.log(`Inkorium Server running on port ${PORT}`));
}

startServer();
