const nativeFetch = window.fetch.bind(window);

function youtubeSearchProxy(input: RequestInfo | URL) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  try {
    const original = new URL(url, window.location.origin);
    if (original.hostname !== 'www.googleapis.com' || original.pathname !== '/youtube/v3/search') return null;

    const proxy = new URL('/api/youtube', window.location.origin);
    ['part', 'q', 'type', 'maxResults', 'pageToken', 'channelId'].forEach((key) => {
      const value = original.searchParams.get(key);
      if (value) proxy.searchParams.set(key, value);
    });
    return proxy.toString();
  } catch {
    return null;
  }
}

window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const proxyUrl = youtubeSearchProxy(input);
  if (!proxyUrl) return nativeFetch(input, init);

  return nativeFetch(proxyUrl, {
    method: 'GET',
    headers: init?.headers,
    signal: init?.signal,
  });
}) as typeof window.fetch;
