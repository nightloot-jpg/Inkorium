import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();

async function source(file) {
  return readFile(join(ROOT, file), 'utf8');
}

test('bootstrap has exactly one React root', async () => {
  const main = await source('src/main.tsx');
  const app = await source('src/App.tsx');
  const bridge = await source('src/features/RouteContentBridge.tsx');
  const count = (text) => (text.match(/createRoot\s*\(/g) ?? []).length;

  assert.equal(count(main), 1);
  assert.equal(count(app), 0);
  assert.equal(count(bridge), 0);
});

test('routing uses browser history and not global click interception', async () => {
  const bridge = await source('src/features/RouteContentBridge.tsx');
  assert.match(bridge, /history\.pushState/);
  assert.match(bridge, /popstate/);
  assert.doesNotMatch(bridge, /document\.addEventListener\(['"]click['"]/);
  assert.doesNotMatch(bridge, /textContent/);
});

test('YouTube browser access stays behind the canonical client', async () => {
  const client = await source('src/lib/youtube.ts');
  const composer = await source('src/components/Composer.tsx');
  const playlist = await source('src/YoutubePlaylist.tsx');
  const index = await source('index.html');

  assert.match(client, /functions\.invoke\(['"]youtube-search['"]/);
  assert.match(composer, /youtubeRequest\(/);
  assert.match(playlist, /youtubeRequest\(/);
  assert.doesNotMatch(composer, /VITE_YOUTUBE_API_KEY/);
  assert.doesNotMatch(playlist, /VITE_YOUTUBE_API_KEY/);
  assert.doesNotMatch(index, /youtube-api-proxy\.ts/);
});

test('legacy YouTube proxy cannot monkey-patch fetch', async () => {
  const proxy = await source('src/platform/youtube-api-proxy.ts');
  assert.doesNotMatch(proxy, /window\.fetch\s*=/);
});

test('media storage uses Hetzner as the canonical object backend', async () => {
  const storage = await source('src/lib/storage.ts');
  const edge = await source('supabase/functions/media-storage/index.ts');

  assert.match(storage, /media-storage/);
  assert.match(edge, /HETZNER_S3_/);
  assert.doesNotMatch(storage, /R2_(ENDPOINT|BUCKET|ACCESS_KEY_ID|SECRET_ACCESS_KEY)/);
});

test('feature CSS is not linked from the HTML entrypoint', async () => {
  const index = await source('index.html');
  const forbidden = [
    'profile-global.css',
    'music-redesign.css',
    'people-search-light.css',
    'people-requests-light.css',
    'notifications.css',
    'tuenti-classic-feed.css',
  ];

  for (const css of forbidden) {
    assert.doesNotMatch(index, new RegExp(css.replace('.', '\\.')));
  }
});

test('route style loader covers the lazy feature pages', async () => {
  const styles = await source('src/features/feature-styles.ts');
  for (const page of ['perfil', 'personas', 'musica', 'videos']) {
    assert.match(styles, new RegExp(`case ['"]${page}['"]`));
  }
});
