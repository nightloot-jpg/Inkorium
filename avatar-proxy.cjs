const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const originalListen = express.application.listen;
let s3Client = null;

function getStorageConfig() {
  const endpoint = process.env.HETZNER_S3_ENDPOINT;
  const accessKeyId = process.env.HETZNER_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.HETZNER_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.HETZNER_S3_BUCKET || 'inkorium-media';
  const region = process.env.HETZNER_S3_REGION || 'hel1';
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: endpoint.replace(/\/+$/, ''),
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false
    });
  }
  return { client: s3Client, bucket };
}

function extractStorageKey(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('/api/profile-avatar')) return null;
  try {
    const url = new URL(raw, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname || '').replace(/^\/+/, '');
    const markers = ['profile-media/', 'avatars/'];
    for (const marker of markers) {
      const index = pathname.indexOf(marker);
      if (index >= 0) {
        const key = pathname.slice(index);
        if (isSafeStorageKey(key)) return key;
      }
    }
    if (markers.some(marker => pathname.startsWith(marker)) && isSafeStorageKey(pathname)) return pathname;
  } catch {}
  return null;
}

function isSafeStorageKey(key) {
  return (key.startsWith('profile-media/') || key.startsWith('avatars/'))
    && !key.includes('..')
    && !key.includes('\\')
    && !key.startsWith('/');
}

function toProxyAvatarUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return raw;
  if (raw.startsWith('/api/profile-avatar')) return raw;
  const key = extractStorageKey(raw);
  return key ? `/api/profile-avatar?key=${encodeURIComponent(key)}` : raw;
}

express.application.listen = function (...args) {
  if (!this.__inkoriumProfileAvatarProxyInstalled) {
    this.__inkoriumProfileAvatarProxyInstalled = true;

    const originalJson = this.response.json;
    this.response.json = function (body) {
      try {
        if (this.req?.path === '/api/profiles' && Array.isArray(body)) {
          body = body.map((profile) => {
            if (!profile || typeof profile !== 'object') return profile;
            const avatar = profile.avatar_url ?? profile.avatar;
            if (!avatar) return profile;
            const proxy = toProxyAvatarUrl(avatar);
            return {
              ...profile,
              ...(Object.prototype.hasOwnProperty.call(profile, 'avatar_url') ? { avatar_url: proxy } : {}),
              ...(Object.prototype.hasOwnProperty.call(profile, 'avatar') ? { avatar: proxy } : {})
            };
          });
        }
      } catch {}
      return originalJson.call(this, body);
    };

    this.get('/api/profile-avatar', async (req, res) => {
      const key = String(req.query?.key || '').trim();
      if (!isSafeStorageKey(key)) return res.status(400).json({ error: 'INVALID_MEDIA_KEY' });

      const storage = getStorageConfig();
      if (!storage) return res.status(503).json({ error: 'STORAGE_NOT_CONFIGURED' });

      try {
        const object = await storage.client.send(new GetObjectCommand({
          Bucket: storage.bucket,
          Key: key
        }));
        if (!object.Body) return res.status(404).end();

        const bytes = Buffer.from(await object.Body.transformToByteArray());
        res.setHeader('Content-Type', object.ContentType || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        if (object.ContentLength != null) res.setHeader('Content-Length', String(object.ContentLength));
        if (object.ETag) res.setHeader('ETag', String(object.ETag));
        return res.status(200).send(bytes);
      } catch (error) {
        console.error('[Inkorium] profile avatar proxy failed:', error?.name || error?.message || error);
        return res.status(404).end();
      }
    });

    const stack = this._router?.stack;
    if (stack) {
      const avatarLayer = stack.pop();
      if (avatarLayer) stack.unshift(avatarLayer);
    }

    // Restore the original response.json when this process exits normally.
    process.once('exit', () => {
      this.response.json = originalJson;
    });
  }
  return originalListen.apply(this, args);
};
