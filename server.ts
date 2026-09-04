import 'dotenv/config';
import express from 'express';
import path from 'path';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHmac, createPublicKey, createVerify, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';

const app = express();
const PORT = 3000;
app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
  'application/pdf', 'text/plain', 'application/zip', 'application/x-zip-compressed',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'pdf', 'txt', 'zip', 'mp3', 'wav', 'doc', 'docx'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').replace(/^\./, '').toLowerCase();
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mime)) return cb(new Error('INVALID_MIME_TYPE'));
    if (ext && !ALLOWED_EXTENSIONS.includes(ext)) return cb(new Error('INVALID_FILE_EXTENSION'));
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

function getSupabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zllwzmfsfzfedorljgtg.supabase.co').replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_npJmIHQP_g2ApAu-7fqQAQ_d2p';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';
  return { supabaseUrl, supabaseKey, serviceRoleKey, jwtSecret };
}

function extractToken(req: express.Request): string {
  const authorization = String(req.headers.authorization || '').trim();
  return authorization.replace(/^Bearer\s+/i, '').trim();
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
  if (payload.exp && Number(payload.exp) <= now) return null;
  if (payload.nbf && Number(payload.nbf) > now + 30) return null;
  if (payload.iss && payload.iss !== `${supabaseUrl}/auth/v1`) return null;
  if (header.alg === 'HS256') {
    if (!jwtSecret) return null;
    const expected = createHmac('sha256', jwtSecret).update(signingInput).digest();
    if (expected.length !== signature.length || !timingSafeEqual(expected, signature)) return null;
    return payload.sub;
  }
  if (header.alg !== 'RS256' && header.alg !== 'ES256') return null;
  const keys = await getJwks(supabaseUrl);
  const jwk = keys.find((key: any) => key.kid === header.kid);
  if (!jwk) return null;
  const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  const verifier = createVerify('SHA256');
  verifier.update(signingInput); verifier.end();
  const verificationSignature = header.alg === 'ES256' ? derEncodeEcdsaSignature(signature) : signature;
  return verifier.verify(publicKey, verificationSignature) ? payload.sub : null;
}

async function verifyCurrentUser(token: string): Promise<string | null> {
  if (!token) return null;
  const { supabaseUrl, jwtSecret } = getSupabaseConfig();
  try { return await verifySupabaseJwt(token, supabaseUrl, jwtSecret); } catch { return null; }
}

async function requireAuthenticated(req: express.Request, res: express.Response): Promise<string | null> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: 'AUTH_REQUIRED' }); return null; }
  const userId = await verifyCurrentUser(token);
  if (!userId) { res.status(401).json({ error: 'INVALID_TOKEN' }); return null; }
  return userId;
}

const inMemoryPosts: any[] = [];
const inMemoryMessages: any[] = [];
const inMemoryChatMessages: any[] = [];
const inMemoryChatBlocks = new Set<string>();
const inMemoryPhotos: any[] = [];
const inMemoryProfiles = new Map<string, any>();
const PHOTO_METADATA_FILE = path.join(process.cwd(), 'photo_metadata.json');
interface PhotoMetadataStoreItem { titulo?: string; archivo?: string; etiquetas?: any[]; comentarios?: any[]; likes?: string[]; privacidad?: string; allowedUserIds?: string[]; }
const inMemoryPhotoMetadata = new Map<string, PhotoMetadataStoreItem>();
function loadPhotoMetadata() { try { if (fs.existsSync(PHOTO_METADATA_FILE)) { const raw = fs.readFileSync(PHOTO_METADATA_FILE, 'utf-8'); const parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object') for (const [k, v] of Object.entries(parsed)) if (v && typeof v === 'object') inMemoryPhotoMetadata.set(String(k), v as PhotoMetadataStoreItem); } } catch {} }
function persistPhotoMetadata() { try { const obj: Record<string, PhotoMetadataStoreItem> = {}; for (const [k, v] of inMemoryPhotoMetadata.entries()) obj[k] = v; const tempPath = `${PHOTO_METADATA_FILE}.tmp`; fs.writeFileSync(tempPath, JSON.stringify(obj, null, 2), 'utf-8'); fs.renameSync(tempPath, PHOTO_METADATA_FILE); } catch {} }
loadPhotoMetadata();
function enrichPhotoWithMetadata(photo: any) { if (!photo || typeof photo !== 'object') return photo; const photoId = String(photo.id); const meta = inMemoryPhotoMetadata.get(photoId) || {}; return { ...photo, etiquetas: Array.isArray(meta.etiquetas) && meta.etiquetas.length > 0 ? meta.etiquetas : (Array.isArray(photo.etiquetas) ? photo.etiquetas : []), comentarios: Array.isArray(meta.comentarios) && meta.comentarios.length > 0 ? meta.comentarios : (Array.isArray(photo.comentarios) ? photo.comentarios : []), likes: Array.isArray(meta.likes) && meta.likes.length > 0 ? meta.likes : (Array.isArray(photo.likes) ? photo.likes : []), privacidad: meta.privacidad || photo.visibility || photo.privacidad || 'amigos', allowedUserIds: Array.isArray(meta.allowedUserIds) ? meta.allowedUserIds : (Array.isArray(photo.allowedUserIds) ? photo.allowedUserIds : []) }; }

const sseClients = new Map<string, Set<express.Response>>();
function registerSseClient(userId: string, res: express.Response) { const key = String(userId).toLowerCase().trim(); if (!key) return; if (!sseClients.has(key)) sseClients.set(key, new Set()); sseClients.get(key)!.add(res); }
function removeSseClient(userId: string, res: express.Response) { const key = String(userId).toLowerCase().trim(); const clients = sseClients.get(key); if (!clients) return; clients.delete(res); if (clients.size === 0) sseClients.delete(key); }
function broadcastRealtimeEvent(targetUserIds: string[], eventName: string, data: any) { const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`; const targets = new Set<string>(); targetUserIds.forEach(id => { if (id) { const clean = String(id).toLowerCase().trim(); targets.add(clean); targets.add(clean.replace(/^user-/, '')); } }); targets.forEach(userId => { const clients = sseClients.get(userId); if (clients) clients.forEach(client => { try { client.write(payload); } catch {} }); }); }

app.get('/api/realtime/stream', async (req, res) => {
  const userId = await requireAuthenticated(req, res); if (!userId) return;
  res.setHeader('Content-Type', 'text/event-stream'); res.setHeader('Cache-Control', 'no-cache, no-transform'); res.setHeader('Connection', 'keep-alive'); res.setHeader('X-Accel-Buffering', 'no'); res.flushHeaders?.();
  res.write(`: connected\n\n`); res.write(`event: init\ndata: ${JSON.stringify({ status: 'connected', userId, timestamp: Date.now() })}\n\n`);
  registerSseClient(userId, res);
  const heartbeat = setInterval(() => { try { res.write(`: ping\n\n`); } catch { clearInterval(heartbeat); } }, 20000);
  req.on('close', () => { clearInterval(heartbeat); removeSseClient(userId, res); });
});

app.post('/api/chat-typing', async (req, res) => {
  const fromUserId = await requireAuthenticated(req, res); if (!fromUserId) return;
  const targetUserId = String(req.body?.targetUserId || '').trim(); const isTyping = Boolean(req.body?.isTyping);
  if (!targetUserId) return res.status(400).json({ error: 'TARGET_USER_REQUIRED' });
  broadcastRealtimeEvent([targetUserId], 'chat_typing', { fromUserId, targetUserId, isTyping, timestamp: Date.now() });
  return res.status(200).json({ success: true });
});

// Lightweight API rate limiting. Production can replace this with a shared Redis implementation.
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(req: express.Request, res: express.Response, limit = 60, windowMs = 60_000): boolean {
  const ip = String(req.ip || req.socket.remoteAddress || 'unknown');
  const key = `${ip}:${req.path}`;
  const now = Date.now();
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) { rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (current.count >= limit) { res.status(429).json({ error: 'RATE_LIMITED' }); return false; }
  current.count += 1;
  return true;
}

app.use('/api/', (req, res, next) => rateLimit(req, res) ? next() : undefined);

app.get('/api/profiles', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const query = new URLSearchParams();
    const requestedSelect = String(req.query.select || '').trim();
    const safeDefaultSelect = 'id,username,full_name,avatar_url,city,user_status,profile_interests,updated_at';
    const select = requestedSelect ? requestedSelect.split(',').filter((col) => ['id','username','full_name','avatar_url','city','user_status','profile_interests','updated_at'].includes(col.trim())).join(',') : safeDefaultSelect;
    query.set('select', select || safeDefaultSelect);
    const requestedLimit = Number(req.query.limit || 100);
    query.set('limit', String(Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 100, 100))));
    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'select' || key === 'limit') continue;
      if (Array.isArray(value)) value.forEach(v => query.append(key, String(v))); else if (value != null) query.set(key, String(value));
    }
    if (!supabaseKey) return res.status(200).json(Array.from(inMemoryProfiles.values()).slice(0, 100));
    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?${query.toString()}`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' } });
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'PROFILE_FETCH_FAILED' });
    const data = await upstream.json();
    return res.status(200).json(Array.isArray(data) ? data : []);
  } catch { return res.status(500).json({ error: 'PROFILE_FETCH_FAILED' }); }
});

app.patch('/api/profiles/:id/avatar', async (req, res) => {
  const authUserId = await requireAuthenticated(req, res); if (!authUserId) return;
  const profileId = String(req.params.id || '').trim();
  if (!profileId || profileId !== authUserId) return res.status(403).json({ error: 'FORBIDDEN' });
  const avatarUrl = String(req.body?.avatar_url || '').trim();
  if (!avatarUrl || avatarUrl.length > 2048) return res.status(400).json({ error: 'INVALID_AVATAR_URL' });
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  if (!supabaseKey) return res.status(503).json({ error: 'PROFILE_STORAGE_UNAVAILABLE' });
  const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, {
    method: 'PATCH',
    headers: { apikey: supabaseKey, Authorization: `Bearer ${extractToken(req)}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
  });
  if (!upstream.ok) return res.status(upstream.status).json({ error: 'AVATAR_SAVE_FAILED' });
  const rows = await upstream.json().catch(() => []);
  return res.status(200).json({ success: true, profile: Array.isArray(rows) ? rows[0] : rows });
});

app.patch('/api/profiles/:id/presence', async (req, res) => {
  const authUserId = await requireAuthenticated(req, res); if (!authUserId) return;
  const profileId = String(req.params.id || '').trim();
  const presence = String(req.body?.presence || '').trim().toLowerCase();
  if (!profileId || profileId !== authUserId) return res.status(403).json({ error: 'FORBIDDEN' });
  if (!['conectado','ausente','ocupado','invisible'].includes(presence)) return res.status(400).json({ error: 'INVALID_PRESENCE' });
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  if (!supabaseKey) return res.status(503).json({ error: 'PROFILE_STORAGE_UNAVAILABLE' });
  const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { method: 'PATCH', headers: { apikey: supabaseKey, Authorization: `Bearer ${extractToken(req)}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ presence }) });
  if (!upstream.ok) return res.status(upstream.status).json({ error: 'PRESENCE_SAVE_FAILED' });
  return res.status(200).json({ success: true });
});

app.patch('/api/profiles/:id', async (req, res) => {
  const authUserId = await requireAuthenticated(req, res); if (!authUserId) return;
  const profileId = String(req.params.id || '').trim();
  if (!profileId || profileId !== authUserId) return res.status(403).json({ error: 'FORBIDDEN' });
  const payload = req.body || {};
  const updateObj: Record<string, any> = { updated_at: new Date().toISOString() };
  if (payload.full_name !== undefined) updateObj.full_name = String(payload.full_name || '').trim().slice(0, 160);
  if (payload.username !== undefined) updateObj.username = String(payload.username || '').trim().slice(0, 80);
  if (payload.avatar_url !== undefined) updateObj.avatar_url = String(payload.avatar_url || '').trim().slice(0, 2048);
  if (payload.city !== undefined) updateObj.city = String(payload.city || '').trim().slice(0, 120);
  if (payload.birth_date !== undefined) updateObj.birth_date = String(payload.birth_date || '').trim().slice(0, 32);
  if (payload.gender !== undefined) updateObj.gender = String(payload.gender || '').trim().slice(0, 20);
  if (payload.user_status !== undefined) updateObj.user_status = String(payload.user_status || '').trim().slice(0, 140);
  if (payload.relationship_status !== undefined) updateObj.relationship_status = String(payload.relationship_status || '').trim().slice(0, 80);
  if (payload.occupation !== undefined) updateObj.occupation = String(payload.occupation || '').trim().slice(0, 120);
  if (payload.profile_interests !== undefined) updateObj.profile_interests = payload.profile_interests;
  if (payload.music !== undefined) updateObj.music = String(payload.music || '').trim().slice(0, 200);
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  if (!supabaseKey) return res.status(503).json({ error: 'PROFILE_STORAGE_UNAVAILABLE' });
  const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { method: 'PATCH', headers: { apikey: supabaseKey, Authorization: `Bearer ${extractToken(req)}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(updateObj) });
  if (!upstream.ok) return res.status(upstream.status).json({ error: 'PROFILE_SAVE_FAILED' });
  const rows = await upstream.json().catch(() => []);
  return res.status(200).json({ success: true, profile: Array.isArray(rows) ? rows[0] : rows });
});

// Existing application routes continue below.
