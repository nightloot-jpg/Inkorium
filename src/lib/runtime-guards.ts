type SupabaseLike = {
  functions: {
    invoke: (name: string, options: { body: unknown }) => Promise<{ data: any; error: any }>;
  };
};

type ObserverEntry = {
  callback: MutationCallback;
  target: Node | null;
  options: MutationObserverInit;
  pending: MutationRecord[];
  frame: number | null;
  active: boolean;
};

let guardsInstalled = false;

function installYoutubeFetchProxy(supabase: SupabaseLike) {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
    let parsed: URL;
    try { parsed = new URL(url, window.location.href); } catch { return nativeFetch(input, init); }

    if (parsed.hostname !== 'www.googleapis.com' || !parsed.pathname.startsWith('/youtube/v3/')) {
      return nativeFetch(input, init);
    }

    const endpoint = parsed.pathname.split('/').pop();
    const supported = endpoint === 'search' || endpoint === 'playlistItems' || endpoint === 'videos';
    if (!supported) return nativeFetch(input, init);

    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      if (key === 'key' || key === 'part') return;
      params[key] = value;
    });

    const { data, error } = await supabase.functions.invoke('youtube-search', {
      body: { endpoint, params },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'No se pudo consultar YouTube.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data || { items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

function installMutationObserverBroker() {
  const NativeMutationObserver = window.MutationObserver;
  if ((window.MutationObserver as any).__inkoriumBroker) return;

  const entries = new Set<ObserverEntry>();
  const nativeObserver = new NativeMutationObserver(records => {
    entries.forEach(entry => {
      if (!entry.active || !entry.target) return;
      const relevant = records.filter(record => {
        const withinTarget = record.target === entry.target || (entry.options.subtree === true && entry.target?.contains(record.target));
        if (!withinTarget) return false;
        if (record.type === 'childList') return entry.options.childList !== false;
        if (record.type === 'attributes') return entry.options.attributes === true;
        if (record.type === 'characterData') return entry.options.characterData === true;
        return false;
      });
      if (!relevant.length) return;

      entry.pending.push(...relevant);
      if (entry.frame !== null) return;
      entry.frame = window.requestAnimationFrame(() => {
        entry.frame = null;
        if (!entry.active || !entry.pending.length) return;
        const batch = entry.pending.splice(0, entry.pending.length);
        entry.callback(batch, brokerObserverFor(entry));
      });
    });
  });

  nativeObserver.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  const observerMap = new WeakMap<ObserverEntry, MutationObserver>();
  const brokerObserverFor = (entry: ObserverEntry) => {
    const existing = observerMap.get(entry);
    if (existing) return existing;
    const observer = Object.create(BrokerMutationObserver.prototype) as MutationObserver;
    observerMap.set(entry, observer);
    return observer;
  };

  class BrokerMutationObserver {
    static __inkoriumBroker = true;
    private entry: ObserverEntry;
    constructor(callback: MutationCallback) {
      this.entry = { callback, target: null, options: {}, pending: [], frame: null, active: true };
      entries.add(this.entry);
      observerMap.set(this.entry, this as unknown as MutationObserver);
    }
    observe(target: Node, options: MutationObserverInit) {
      this.entry.target = target;
      this.entry.options = options;
      this.entry.active = true;
    }
    disconnect() {
      this.entry.active = false;
      this.entry.pending = [];
      if (this.entry.frame !== null) cancelAnimationFrame(this.entry.frame);
      this.entry.frame = null;
      this.entry.target = null;
      entries.delete(this.entry);
    }
    takeRecords() {
      const records = this.entry.pending.splice(0, this.entry.pending.length);
      return records;
    }
  }

  (BrokerMutationObserver.prototype as any).constructor = BrokerMutationObserver;
  (window as any).MutationObserver = BrokerMutationObserver;
}

export function installRuntimeGuards(supabase: SupabaseLike) {
  if (guardsInstalled || typeof window === 'undefined') return;
  guardsInstalled = true;
  installYoutubeFetchProxy(supabase);
  installMutationObserverBroker();
}
