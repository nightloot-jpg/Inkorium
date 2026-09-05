import express from 'express';

const WINDOW_MS = 60_000;
const MAX_MUTATIONS_PER_WINDOW = 60;
const MAX_UPLOADS_PER_HOUR = 10;

const counters = new Map<string, { count: number; resetAt: number }>();
const uploadCounters = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: express.Request, userId?: string) {
  return `${userId || 'anon'}:${req.ip || req.socket.remoteAddress || 'unknown'}:${req.path}`;
}

function hitRateLimit(store: Map<string, { count: number; resetAt: number }>, key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > max;
}

async function resolveUser(req: express.Request): Promise<string | null> {
  const header = String(req.headers.authorization || '').trim();
  const token = header.replace(/^Bearer\s+/i, '').trim() || String((req.body as any)?.access_token || '').trim();
  if (!token) return null;

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const supabaseKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    if (!response.ok) return null;
    const user = await response.json();
    const id = String(user?.id || '').trim();
    return id || null;
  } catch {
    return null;
  }
}

function pathsForAuth(method: string, path: string) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false;
  if (path === '/api/health' || path === '/api/storage/status') return false;
  return (
    path === '/api/upload' ||
    path.startsWith('/api/posts') ||
    path.startsWith('/api/profile-signatures') ||
    path.startsWith('/api/profile_signatures') ||
    path.startsWith('/api/chat-messages') ||
    path.startsWith('/api/chat-typing') ||
    path.startsWith('/api/chat-nudge') ||
    path.startsWith('/api/chat-blocks') ||
    path.startsWith('/api/chat-read') ||
    path.startsWith('/api/private-messages') ||
    path.startsWith('/api/profiles/') ||
    path.startsWith('/api/photos')
  );
}

function installOnRouteMethod(method: 'post' | 'put' | 'patch' | 'delete' | 'get') {
  const proto = express.application as any;
  const original = proto[method];
  if (!original || original.__inkoriumHardeningWrapped) return;

  const wrapped = function (path: any, ...handlers: any[]) {
    const wrappedHandlers = handlers.map((handler: any) => {
      if (typeof handler !== 'function') return handler;
      return async function hardenedRoute(this: any, req: express.Request, res: express.Response, next: express.NextFunction) {
        const requestPath = String(req.path || req.originalUrl || '');

        if (method === 'get' && (requestPath === '/api/profile-signatures' || requestPath === '/api/profile_signatures')) {
          const profileId = String(req.query.profile_id || req.query.target_id || '').replace(/^eq\./, '').trim();
          const authorId = String(req.query.author_id || '').replace(/^eq\./, '').trim();
          const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
          const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
          if (supabaseUrl && key) {
            try {
              const params = new URLSearchParams();
              params.set('select', 'id,profile_id,author_id,content,created_at');
              if (profileId) params.set('profile_id', `eq.${profileId}`);
              if (authorId) params.set('author_id', `eq.${authorId}`);
              params.set('order', 'created_at.desc');
              const upstream = await fetch(`${supabaseUrl}/rest/v1/profile_signatures?${params.toString()}`, {
                headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
              });
              if (upstream.ok) return res.status(200).json(await upstream.json());
            } catch {}
          }
        }

        if (pathsForAuth(method.toUpperCase(), requestPath)) {
          const userId = await resolveUser(req);
          if (!userId) return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Se requiere una sesión válida.' });
          (req as any).authUserId = userId;

          if (hitRateLimit(counters, clientKey(req, userId), MAX_MUTATIONS_PER_WINDOW, WINDOW_MS)) {
            return res.status(429).json({ error: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Inténtalo de nuevo en unos instantes.' });
          }

          if (requestPath === '/api/upload') {
            if (hitRateLimit(uploadCounters, `${userId}:${req.ip || req.socket.remoteAddress || 'unknown'}`, MAX_UPLOADS_PER_HOUR, 60 * 60 * 1000)) {
              return res.status(429).json({ error: 'UPLOAD_RATE_LIMITED', message: 'Límite temporal de subidas alcanzado.' });
            }
            if (!process.env.HETZNER_S3_ENDPOINT || !process.env.HETZNER_S3_ACCESS_KEY_ID || !process.env.HETZNER_S3_SECRET_ACCESS_KEY) {
              return res.status(503).json({ error: 'MEDIA_STORAGE_UNAVAILABLE', message: 'Hetzner Object Storage no está configurado.' });
            }
          }

          const body = (req.body || {}) as any;
          const force = (name: string) => {
            if (body && typeof body === 'object' && !Array.isArray(body)) body[name] = userId;
          };
          if (requestPath.startsWith('/api/profiles/')) {
            (req.params as any).id = userId;
          } else if (requestPath === '/api/chat-messages') {
            force('emisorId'); force('sender_id'); force('from');
          } else if (requestPath === '/api/chat-typing') {
            force('fromUserId');
          } else if (requestPath === '/api/chat-nudge') {
            force('fromUserId');
          } else if (requestPath === '/api/chat-blocks') {
            force('blockerId');
          } else if (requestPath === '/api/chat-read') {
            force('readerId'); force('userId');
          } else if (requestPath.startsWith('/api/private-messages')) {
            force('sender_id');
          } else if (requestPath.startsWith('/api/posts')) {
            force('author_id');
          } else if (requestPath.startsWith('/api/profile-signatures') || requestPath.startsWith('/api/profile_signatures')) {
            if (method === 'post') {
              if (Array.isArray(req.body)) req.body = req.body.map((item: any) => ({ ...item, author_id: userId }));
              else if (req.body && typeof req.body === 'object') req.body.author_id = userId;
            }
          }
        }

        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; frame-src 'self' https:");

        return handler.call(this, req, res, next);
      };
    });
    return original.call(this, path, ...wrappedHandlers);
  };

  wrapped.__inkoriumHardeningWrapped = true;
  proto[method] = wrapped;
}

installOnRouteMethod('get');
installOnRouteMethod('post');
installOnRouteMethod('put');
installOnRouteMethod('patch');
installOnRouteMethod('delete');
