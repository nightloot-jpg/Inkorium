import 'dotenv/config';
import express from 'express';
import path from 'path';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createServer as createViteServer } from 'vite';
import { createHmac, createPublicKey, createVerify, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';

const app = express();
const PORT = 3000;
app.disable('x-powered-by');

// Safer baseline headers for a public social network.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Keep JSON requests small. File uploads are handled separately by multer.
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
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mime)) return cb(new Error('INVALID_MIME_TYPE'));
    const ext = path.extname(file.originalname || '').replace(/^\./, '').toLowerCase();
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
  if (!s3Client) {
    s3Client = new S3Client({ endpoint: endpoint.replace(/\/+$/, ''), region, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: false });
  }
  return { client: s3Client, bucket, endpoint: endpoint.replace(/\/+$/, ''), publicUrlBase };
}

// Do not expose bucket names/configuration through a public debug endpoint.
app.get('/api/storage/status', async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
  const userId = await verifyCurrentUser(token);
  if (!userId) return res.status(401).json({ error: 'INVALID_TOKEN' });
  res.json({ configured: !!getHetznerS3Client() });
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
  } catch {
    return null;
  }
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
  try {
    return await verifySupabaseJwt(token, supabaseUrl, jwtSecret);
  } catch {
    return null;
  }
}

function requireAuthenticated(req: express.Request, res: express.Response): Promise<string | null> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'AUTH_REQUIRED' });
    return Promise.resolve(null);
  }
  return verifyCurrentUser(token).then((userId) => {
    if (!userId) res.status(401).json({ error: 'INVALID_TOKEN' });
    return userId;
  });
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
    if (uuidRegex.test(clean)) {
      const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(clean)}&select=id`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
      });
      const rows = await res.json().catch(() => []);
      if (Array.isArray(rows) && rows.length > 0) return rows[0].id;
    }
    const cleanUsername = clean.replace(/^user-/, '');
    const resUser = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}&select=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
    const rowsUser = await resUser.json().catch(() => []);
    if (Array.isArray(rowsUser) && rowsUser.length > 0) return rowsUser[0].id;
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

// Runtime-only fallback stores are retained for non-critical transient UI events.
const inMemoryPosts: any[] = [];
const inMemoryMessages: any[] = [];
const inMemoryChatMessages: any[] = [];
const inMemoryChatBlocks = new Set<string>();
const inMemoryPhotos: any[] = [];
const inMemoryProfiles = new Map<string, any>();

const PHOTO_METADATA_FILE = path.join(process.cwd(), 'photo_metadata.json');
interface PhotoMetadataStoreItem { titulo?: string; archivo?: string; etiquetas?: any[]; comentarios?: any[]; likes?: string[]; privacidad?: string; allowedUserIds?: string[]; }
const inMemoryPhotoMetadata = new Map<string, PhotoMetadataStoreItem>();
function loadPhotoMetadata() {
  try {
    if (fs.existsSync(PHOTO_METADATA_FILE)) {
      const raw = fs.readFileSync(PHOTO_METADATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') for (const [k, v] of Object.entries(parsed)) if (v && typeof v === 'object') inMemoryPhotoMetadata.set(String(k), v as PhotoMetadataStoreItem);
    }
  } catch (err) { console.warn('Could not read photo_metadata.json:', err); }
}
function persistPhotoMetadata() {
  try {
    const obj: Record<string, PhotoMetadataStoreItem> = {};
    for (const [k, v] of inMemoryPhotoMetadata.entries()) obj[k] = v;
    const tempPath = `${PHOTO_METADATA_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(obj, null, 2), 'utf-8');
    fs.renameSync(tempPath, PHOTO_METADATA_FILE);
  } catch (err) { console.warn('Could not persist photo_metadata.json:', err); }
}
loadPhotoMetadata();
function enrichPhotoWithMetadata(photo: any) {
  if (!photo || typeof photo !== 'object') return photo;
  const photoId = String(photo.id);
  const meta = inMemoryPhotoMetadata.get(photoId) || {};
  return { ...photo, etiquetas: Array.isArray(meta.etiquetas) && meta.etiquetas.length > 0 ? meta.etiquetas : (Array.isArray(photo.etiquetas) ? photo.etiquetas : []), comentarios: Array.isArray(meta.comentarios) && meta.comentarios.length > 0 ? meta.comentarios : (Array.isArray(photo.comentarios) ? photo.comentarios : []), likes: Array.isArray(meta.likes) && meta.likes.length > 0 ? meta.likes : (Array.isArray(photo.likes) ? photo.likes : []), privacidad: meta.privacidad || photo.visibility || photo.privacidad || 'amigos', allowedUserIds: Array.isArray(meta.allowedUserIds) ? meta.allowedUserIds : (Array.isArray(photo.allowedUserIds) ? photo.allowedUserIds : []) };
}

// Real-time server-sent events
const sseClients = new Map<string, Set<express.Response>>();
function registerSseClient(userId: string, res: express.Response) { if (!userId) return; const normId = userId.toLowerCase().trim(); if (!sseClients.has(normId)) sseClients.set(normId, new Set()); sseClients.get(normId)!.add(res); }
function removeSseClient(userId: string, res: express.Response) { if (!userId) return; const normId = userId.toLowerCase().trim(); const set = sseClients.get(normId); if (set) { set.delete(res); if (set.size === 0) sseClients.delete(normId); } }
function broadcastRealtimeEvent(targetUserIds: string[], eventName: string, data: any) {
  const payload = `event: ${eventName}\\ndata: ${JSON.stringify(data)}\\n\\n`;
  const targets = new Set<string>();
  targetUserIds.forEach(id => { if (id) { const clean = String(id).toLowerCase().trim(); targets.add(clean); targets.add(clean.replace(/^user-/, '')); } });
  targets.forEach(userId => { const clients = sseClients.get(userId); if (clients) clients.forEach(client => { try { client.write(payload); } catch {} }); });
}

app.get('/api/realtime/stream', async (req, res) => {
  const userId = await requireAuthenticated(req, res);
  if (!userId) return;
  res.setHeader('Content-Type', 'text/event-stream'); res.setHeader('Cache-Control', 'no-cache, no-transform'); res.setHeader('Connection', 'keep-alive'); res.setHeader('X-Accel-Buffering', 'no'); res.flushHeaders?.();
  res.write(`: connected\\n\\n`); res.write(`event: init\\ndata: ${JSON.stringify({ status: 'connected', userId, timestamp: Date.now() })}\\n\\n`);
  registerSseClient(userId, res);
  const heartbeat = setInterval(() => { try { res.write(`: ping\\n\\n`); } catch { clearInterval(heartbeat); } }, 20000);
  req.on('close', () => { clearInterval(heartbeat); removeSseClient(userId, res); });
});

app.post('/api/chat-typing', async (req, res) => {
  const fromUserId = await requireAuthenticated(req, res); if (!fromUserId) return;
  const targetUserId = String(req.body?.targetUserId || '').trim(); const isTyping = Boolean(req.body?.isTyping);
  if (!targetUserId) return res.status(400).json({ error: 'TARGET_USER_REQUIRED' });
  broadcastRealtimeEvent([targetUserId], 'chat_typing', { fromUserId, targetUserId, isTyping, timestamp: Date.now() });
  return res.status(200).json({ success: true });
});

// The rest of the application endpoints remain below in the same file.
