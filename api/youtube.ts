export default async function handler(req: any, res: any) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'YOUTUBE_API_KEY is not configured on the server.' });
    return;
  }

  const query = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  const type = typeof req.query?.type === 'string' ? req.query.type : 'video';
  const part = typeof req.query?.part === 'string' ? req.query.part : 'snippet';
  const maxResults = Math.min(Math.max(Number(req.query?.maxResults) || 10, 1), 25);

  if (!query) {
    res.status(400).json({ error: 'Missing q query parameter.' });
    return;
  }
  if (!['video', 'playlist', 'channel'].includes(type)) {
    res.status(400).json({ error: 'Unsupported YouTube search type.' });
    return;
  }

  const upstream = new URL('https://www.googleapis.com/youtube/v3/search');
  upstream.searchParams.set('part', part);
  upstream.searchParams.set('q', query);
  upstream.searchParams.set('type', type);
  upstream.searchParams.set('maxResults', String(maxResults));
  if (typeof req.query?.pageToken === 'string' && req.query.pageToken) {
    upstream.searchParams.set('pageToken', req.query.pageToken);
  }
  if (typeof req.query?.channelId === 'string' && req.query.channelId) {
    upstream.searchParams.set('channelId', req.query.channelId);
  }
  upstream.searchParams.set('key', apiKey);

  try {
    const response = await fetch(upstream);
    const payload = await response.json();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(response.status).json(payload);
  } catch (error) {
    console.error('YouTube proxy failed', error);
    res.status(502).json({ error: 'YouTube request failed.' });
  }
}
