const NativeMutationObserver = window.MutationObserver;

type BatchedEntry = {
  callback: MutationCallback;
  observer: BatchedMutationObserver;
};

const bodyObservers = new Set<BatchedEntry>();
let sharedObserver: MutationObserver | null = null;
let frameId: number | null = null;

function flushBodyObservers() {
  frameId = null;
  bodyObservers.forEach(({ callback, observer }) => {
    try {
      callback([], observer as unknown as MutationObserver);
    } catch (error) {
      console.error('Batched MutationObserver callback failed', error);
    }
  });
}

function ensureSharedObserver() {
  if (sharedObserver) return;
  sharedObserver = new NativeMutationObserver(() => {
    if (frameId !== null) return;
    frameId = window.requestAnimationFrame(flushBodyObservers);
  });
  sharedObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
}

function releaseSharedObserver() {
  if (bodyObservers.size > 0 || !sharedObserver) return;
  sharedObserver.disconnect();
  sharedObserver = null;
  if (frameId !== null) {
    window.cancelAnimationFrame(frameId);
    frameId = null;
  }
}

class BatchedMutationObserver {
  private callback: MutationCallback;
  private native: MutationObserver | null = null;
  private bodyEntry: BatchedEntry | null = null;

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe(target: Node, options: MutationObserverInit = {}) {
    this.disconnect();

    if (
      target === document.body &&
      options.subtree === true &&
      (options.childList || options.attributes || options.characterData)
    ) {
      this.bodyEntry = { callback: this.callback, observer: this };
      bodyObservers.add(this.bodyEntry);
      ensureSharedObserver();
      return;
    }

    this.native = new NativeMutationObserver(this.callback);
    this.native.observe(target, options);
  }

  disconnect() {
    if (this.bodyEntry) {
      bodyObservers.delete(this.bodyEntry);
      this.bodyEntry = null;
      releaseSharedObserver();
    }
    this.native?.disconnect();
    this.native = null;
  }

  takeRecords() {
    return this.native?.takeRecords() ?? [];
  }
}

window.MutationObserver = BatchedMutationObserver as unknown as typeof MutationObserver;
