import express from 'express';
import path from 'path';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

let s3Client: S3Client | null = null;

function getHetznerS3Client(): { client: S3Client; bucket: string; endpoint: string; publicUrlBase?: string } | null {
  const endpoint = process.env.HETZNER_S3_ENDPOINT;
  const accessKeyId = process.env.HETZNER_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.HETZNER_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.HETZNER_S3_BUCKET || 'inkorium-media';
  const region = process.env.HETZNER_S3_REGION || 'fsn1';
  const publicUrlBase = process.env.HETZNER_S3_PUBLIC_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true
    });
  }

  return { client: s3Client, bucket, endpoint, publicUrlBase };
}

app.get('/api/storage/status', (req, res) => {
  const hetznerConfig = getHetznerS3Client();
  res.json({
    hetznerConfigured: !!hetznerConfig,
    bucket: hetznerConfig?.bucket || null,
    endpoint: process.env.HETZNER_S3_ENDPOINT ? 'Configured' : 'Not configured'
  });
});

function getSupabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zllwzmfsfzfedorljgtg.supabase.co').replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return { supabaseUrl, supabaseKey };
}

app.get('/api/profiles', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        for (const item of value) query.append(key, String(item));
      } else if (value != null) {
        query.set(key, String(value));
      }
    }
    if (!query.has('select')) query.set('select', 'id,username,full_name,avatar_url,city,birth_date,user_status,profile_interests,updated_at');
    if (!query.has('limit')) query.set('limit', '1000');

    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?${query.toString()}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' }
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(body);
  } catch (err: any) {
    console.error('Supabase profiles proxy failed:', err);
    return res.status(502).json({ error: 'SUPABASE_PROXY_FAILED', message: err?.message || 'Unable to load profiles from Supabase.' });
  }
});

// Presence updates use a request-body access token deliberately. Sending the JWT
// in Authorization caused 431 errors at the reverse proxy due to header size.
app.patch('/api/profiles/:id/presence', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const profileId = String(req.params.id || '').trim();
    const presence = String(req.body?.presence || '').trim().toLowerCase();
    const token = String(req.body?.access_token || '').trim();

    if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    if (!profileId || !['conectado', 'ausente', 'ocupado', 'invisible'].includes(presence)) return res.status(400).json({ error: 'INVALID_PRESENCE' });
    if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });

    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, {
      method: 'PATCH',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ presence })
    });

    const body = await upstream.text();
    if (!upstream.ok) {
      res.status(upstream.status);
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      return res.send(body);
    }
    return res.status(204).end();
  } catch (err: any) {
    console.error('Supabase presence proxy failed:', err);
    return res.status(502).json({ error: 'SUPABASE_PRESENCE_PROXY_FAILED', message: err?.message || 'Unable to update profile presence.' });
  }
});

app.patch('/api/profiles/:id/avatar', async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const profileId = String(req.params.id || '').trim();
    const avatarUrl = String(req.body?.avatar_url || '').trim();
    const token = String(req.body?.access_token || '').trim() || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();

    if (!supabaseKey) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    if (!profileId) return res.status(400).json({ error: 'INVALID_PROFILE_ID' });
    if (!avatarUrl || !/^https?:\/\//i.test(avatarUrl)) return res.status(400).json({ error: 'INVALID_AVATAR_URL' });
    if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });

    const upstream = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, {
      method: 'PATCH',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    });

    const body = await upstream.text();
    if (!upstream.ok) {
      res.status(upstream.status);
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      return res.send(body);
    }
    return res.status(200).json({ success: true, avatar_url: avatarUrl });
  } catch (err: any) {
    console.error('Supabase avatar proxy failed:', err);
    return res.status(502).json({ error: 'SUPABASE_AVATAR_PROXY_FAILED', message: err?.message || 'Unable to update profile avatar.' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const folder = (req.body.folder as string) || 'photos';
    if (!file) return res.status(400).json({ error: 'No se ha enviado ningún archivo para subir.' });

    const hetzner = getHetznerS3Client();
    if (!hetzner) return res.status(503).json({ error: 'HETZNER_STORAGE_NOT_CONFIGURED', message: 'Hetzner S3 Object Storage credentials are not set in environment.' });

    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    await hetzner.client.send(new PutObjectCommand({ Bucket: hetzner.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype || 'image/jpeg', ACL: 'public-read' }));

    const publicUrl = hetzner.publicUrlBase
      ? `${hetzner.publicUrlBase.replace(/\/+$/, '')}/${key}`
      : `${hetzner.endpoint.replace(/\/+$/, '')}/${hetzner.bucket}/${key}`;

    return res.json({ success: true, url: publicUrl, key, bucket: hetzner.bucket, provider: 'hetzner' });
  } catch (err: any) {
    console.error('Error uploading file to Hetzner Object Storage:', err);
    return res.status(500).json({ error: 'UPLOAD_FAILED', message: err?.message || 'Error al subir el archivo al almacenamiento de Hetzner.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Inkorium Server running on port ${PORT}`));
}

startServer();
