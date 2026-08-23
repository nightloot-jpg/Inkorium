# Migración de Supabase Storage a Cloudflare R2

## Arquitectura

Supabase sigue gestionando Auth y PostgreSQL. Cloudflare R2 pasa a ser el almacenamiento de imágenes, vídeos y audio.

La aplicación usa las Edge Functions `r2-media` y `r2-video` para generar URLs firmadas. Las credenciales de R2 nunca deben llegar al bundle del navegador.

## Buckets actuales de Supabase

La migración contempla estos buckets:

- `photos`
- `post-media`
- `profile-media`
- `music-media`
- `videos`

Los objetos se copian a un único bucket de R2 conservando el bucket de origen como prefijo:

`<bucket>/<path-original>`

Esto permite migrar sin colisiones y mantener trazabilidad.

## Cloudflare R2

Crea un bucket de producción, por ejemplo `inkorium-media`, y asocia el dominio público que vaya a utilizar la aplicación, por ejemplo `media.inkorium.es`.

Variables necesarias para las Edge Functions y para el workflow:

- `R2_ENDPOINT`: endpoint S3 de la cuenta de Cloudflare
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`: base pública sin `/` final, por ejemplo `https://media.inkorium.es`

Configura CORS del bucket para permitir `PUT`, `GET` y `HEAD` desde el dominio de Inkorium.

## Secrets de GitHub Actions

Añade estos secrets al repositorio `nightloot-jpg/Inkorium`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

## Ejecución de la migración histórica

1. Abre GitHub Actions.
2. Ejecuta `Migrate Supabase Storage to Cloudflare R2` manualmente.
3. Escribe exactamente `MIGRATE` en el campo de confirmación.
4. Descarga el artefacto `r2-migration-manifest` y comprueba que los objetos fueron copiados.
5. Verifica perfiles, fotos, publicaciones, vídeos y música en producción.
6. Mantén Supabase Storage intacto hasta completar la verificación.

El workflow no elimina objetos de Supabase. La retirada del Storage antiguo debe ser una operación separada y posterior.
