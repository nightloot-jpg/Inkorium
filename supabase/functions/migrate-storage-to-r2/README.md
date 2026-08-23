# Migración de Supabase Storage a Cloudflare R2

Migra lo que ya había en Supabase Storage a R2 para:
- `post-media` (fotos del feed) → `posts/` en R2
- `music-media` (audio subido) → `music/` en R2
- `photos` (imágenes del chat) → `chat/` en R2

Los vídeos y el avatar/portada de perfil **no** están incluidos — ya estaban en R2 (vídeos) o se han dejado fuera a propósito (avatar/portada).

## 1. Configurar secretos en Supabase

Esta función reutiliza las mismas variables de R2 que ya tienen `r2-media` y `r2-video`
(`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`).
Solo falta añadir un secreto nuevo:

```
supabase secrets set MIGRATION_ADMIN_SECRET=<un valor largo y aleatorio que solo tú conozcas>
```

`SUPABASE_SERVICE_ROLE_KEY` ya está disponible automáticamente dentro de cualquier Edge Function.

## 2. Desplegar la función

```
supabase functions deploy migrate-storage-to-r2
```

## 3. Ejecutarla (primero en modo simulación)

```
export MIGRATION_ADMIN_SECRET=<el mismo valor de arriba>
export FUNCTION_URL=https://<tu-proyecto>.supabase.co/functions/v1/migrate-storage-to-r2

./run_migration.sh post-media --dry-run
./run_migration.sh music-media --dry-run
./run_migration.sh photos --dry-run
```

Revisa la salida: `total`, y cada `results[].status` como `would-migrate` o `error`.
Nada se escribe todavía — es solo una previsualización.

## 4. Ejecutar de verdad

Cuando el dry-run tenga buena pinta, repite con `--write`:

```
./run_migration.sh post-media --write
./run_migration.sh music-media --write
./run_migration.sh photos --write
```

Cada llamada procesa como mucho 20 ficheros (para no agotar el tiempo límite de la
función) y sigue automáticamente hasta que `done: true`. El script imprime el
JSON completo de cada página por si algo falla y quieres reintentar solo esos
archivos.

## Qué hace exactamente

Por cada archivo:
1. Lo descarga de Supabase Storage.
2. Lo sube a R2 con la misma ruta relativa, bajo el prefijo correspondiente
   (`posts/`, `music/` o `chat/`).
3. Actualiza la fila que lo referencia:
   - `posts.media_data->>url` (fotos tipo `photo`)
   - `music_tracks.audio_url` (pistas `source_type = 'local'`, matcheadas por
     su antiguo `youtube_id`, que se usaba como ruta de almacenamiento)
   - `chat_messages.content` (mensajes `type = 'image'`)

**No borra nada del bucket original de Supabase.** Una vez confirmes que todo
se ve bien en la app, puedes borrar manualmente los buckets `post-media`,
`music-media` y `photos` desde el dashboard de Supabase.

## Notas

- Es seguro volver a ejecutar `--write`: si una fila ya no coincide con la URL
  antigua (porque ya se migró), simplemente no actualiza nada esa vez, pero sí
  vuelve a subir el archivo a R2 (sobrescribiendo el mismo key, sin problema).
- Los vídeos dentro de `post-media` (con prefijo `video-`) se filtran automáticamente
  por tipo MIME y no se tocan.
