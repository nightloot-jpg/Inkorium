import { createRoot, type Root } from 'react-dom/client';
import { FeedRightRail } from '../features/feed/feed-right-rail';

const HOST_ID = 'inkorium-feed-right-rail';
let root: Root | null = null;

function sync() {
  const shell = document.querySelector('.feed-app');
  const layout = document.querySelector('.feed-layout');
  const stream = document.querySelector('.stream');
  if (!shell || !layout || !stream) {
    root?.unmount();
    root = null;
    document.getElementById(HOST_ID)?.remove();
    return;
  }

  let host = document.getElementById(HOST_ID) as HTMLElement | null;
  if (!host) {
    host = document.createElement('aside');
    host.id = HOST_ID;
    host.className = 'right-column inkorium-right-column';
    layout.appendChild(host);
  }

  if (!root) root = createRoot(host);
  void import('../lib/supabase').then(({ supabase }) => supabase.auth.getSession()).then(({ data }) => {
    if (!data.session || !document.getElementById(HOST_ID)) return;
    root?.render(<FeedRightRail userId={data.session.user.id} />);
  });
}

new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
sync();
