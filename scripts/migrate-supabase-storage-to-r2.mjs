import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_BASE_URL'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Falta la variable ${key}`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const r2 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
const publicBase = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');
const buckets = ['photos', 'post-media', 'profile-media', 'music-media', 'videos'];

const manifest = [];
const replacements = new Map();
let copied = 0;

async function listAll(bucket, prefix = '') {
  const all = [];
  let from = 0;
  const pageSize = 100;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: pageSize, offset: from, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(`No se pudo listar ${bucket}/${prefix}: ${error.message}`);
    if (!data?.length) break;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id || item.metadata) all.push({ path, item });
      else all.push(...await listAll(bucket, path));
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function originalPublicUrl(bucket, path) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

async function copyObject(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`No se pudo descargar ${bucket}/${path}: ${error.message}`);
  const r2Key = `${bucket}/${path}`;
  const body = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || 'application/octet-stream';
  await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: r2Key, Body: body, ContentType: contentType }));
  const url = `${publicBase}/${r2Key.split('/').map(encodeURIComponent).join('/')}`;
  const oldUrl = originalPublicUrl(bucket, path);
  manifest.push({ bucket, path, r2Key, oldUrl, url, contentType, bytes: body.length });
  replacements.set(oldUrl, url);
  replacements.set(decodeURIComponent(oldUrl), url);
  copied += 1;
  console.log(`[${copied}] ${bucket}/${path} -> ${r2Key}`);
}

async function migrateStorage() {
  for (const bucket of buckets) {
    const objects = await listAll(bucket);
    console.log(`${bucket}: ${objects.length} objetos`);
    for (const { path } of objects) await copyObject(bucket, path);
  }
}

function replaceDeep(value) {
  if (typeof value === 'string') {
    for (const [oldUrl, newUrl] of replacements) if (value.includes(oldUrl)) return value.split(oldUrl).join(newUrl);
    return value;
  }
  if (Array.isArray(value)) return value.map(replaceDeep);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceDeep(v)]));
  return value;
}

async function updateRows(table, selectColumns, mapRow) {
  const { data, error } = await supabase.from(table).select(selectColumns);
  if (error) throw new Error(`No se pudo leer ${table}: ${error.message}`);
  for (const row of data || []) {
    const patch = mapRow(row);
    if (!patch || Object.keys(patch).length === 0) continue;
    const idField = row.id !== undefined ? 'id' : table === 'profiles' ? 'id' : null;
    if (!idField) continue;
    const { error: updateError } = await supabase.from(table).update(patch).eq(idField, row[idField]);
    if (updateError) throw new Error(`No se pudo actualizar ${table}/${row[idField]}: ${updateError.message}`);
  }
}

async function migrateDatabase() {
  await updateRows('profiles', 'id, avatar_url, banner_url', row => ({
    ...(row.avatar_url ? { avatar_url: replaceDeep(row.avatar_url) } : {}),
    ...(row.banner_url ? { banner_url: replaceDeep(row.banner_url) } : {}),
  }));

  await updateRows('photos', 'id, storage_path, url', row => {
    const newUrl = replaceDeep(row.url);
    let storagePath = row.storage_path;
    if (storagePath && replacements.has(originalPublicUrl('photos', storagePath))) storagePath = `photos/${storagePath}`;
    return { ...(newUrl !== row.url ? { url: newUrl } : {}), ...(storagePath !== row.storage_path ? { storage_path: storagePath } : {}) };
  });

  await updateRows('post_images', 'id, storage_path', row => {
    const old = originalPublicUrl('post-media', row.storage_path);
    return replacements.has(old) ? { storage_path: `post-media/${row.storage_path}` } : {};
  });

  await updateRows('post_videos', 'id, storage_path, thumbnail_path', row => ({
    ...(row.storage_path && replacements.has(originalPublicUrl('post-media', row.storage_path)) ? { storage_path: `post-media/${row.storage_path}` } : {}),
    ...(row.thumbnail_path && replacements.has(originalPublicUrl('post-media', row.thumbnail_path)) ? { thumbnail_path: `post-media/${row.thumbnail_path}` } : {}),
  }));

  await updateRows('posts', 'id, media_data', row => {
    const updated = replaceDeep(row.media_data);
    return JSON.stringify(updated) !== JSON.stringify(row.media_data) ? { media_data: updated } : {};
  });

  await updateRows('user_videos', 'id, url', row => {
    const updated = replaceDeep(row.url);
    return updated !== row.url ? { url: updated } : {};
  });

  await updateRows('music_tracks', 'id, audio_url, cover_url, source_type, youtube_id', row => {
    const patch = {};
    if (row.audio_url) {
      const updatedAudio = replaceDeep(row.audio_url);
      if (updatedAudio !== row.audio_url) patch.audio_url = updatedAudio;
    }
    if (row.cover_url) {
      const updatedCover = replaceDeep(row.cover_url);
      if (updatedCover !== row.cover_url) patch.cover_url = updatedCover;
    }
    if (row.source_type === 'local' && row.youtube_id) {
      const old = originalPublicUrl('music-media', row.youtube_id);
      if (replacements.has(old)) patch.audio_url = replacements.get(old);
    }
    return patch;
  });

  for (const table of ['music_playlists', 'profile_music_favorite_artists', 'groups', 'events', 'chat_channels', 'categories']) {
    const columns = {
      music_playlists: 'id, cover_url',
      profile_music_favorite_artists: 'id, cover_url',
      groups: 'id, avatar_url, banner_url',
      events: 'id, cover_url',
      chat_channels: 'id, avatar_url',
      categories: 'id, icon_url',
    }[table];
    await updateRows(table, columns, row => {
      const patch = {};
      for (const key of ['cover_url', 'avatar_url', 'banner_url', 'icon_url']) if (row[key]) {
        const updated = replaceDeep(row[key]);
        if (updated !== row[key]) patch[key] = updated;
      }
      return patch;
    });
  }

  const { error } = await supabase.from('system_migrations').upsert({ key: 'cloudflare_r2_storage_2026', completed_at: new Date().toISOString(), object_count: copied }, { onConflict: 'key' }).catch(() => ({ error: null }));
  if (error) console.warn(`No se pudo registrar el marcador de migración: ${error.message}`);
}

await migrateStorage();
await migrateDatabase();
await Bun.write('r2-migration-manifest.json', JSON.stringify({ generatedAt: new Date().toISOString(), objectCount: manifest.length, objects: manifest }, null, 2));
console.log(`Migración terminada: ${manifest.length} objetos copiados a R2.`);
console.log('El script NO elimina los objetos de Supabase Storage. Verifica producción antes de retirarlos.');
