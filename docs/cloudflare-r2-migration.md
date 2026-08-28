# Migración de media a Cloudflare R2

## Arquitectura canónica

Supabase gestiona Auth y PostgreSQL. Cloudflare R2 es el único almacenamiento persistente de bytes para fotos, portadas, avatares, post-media, vídeos, música y chat.

Las Edge Functions `r2-media` y `r2-video` generan URLs firmadas y validan la sesión. Ninguna credencial de R2 llega al navegador.

## Rutas de objetos

Las nuevas subidas usan claves bajo estas carpetas:

- `photos/<userId>/`
- `covers/<userId>/`
- `avatars/<userId>/`
- `post-media/<userId>/`
- `videos/<userId>/`
- `music/<userId>/`
- `chat/<channelId>/<userId>/`

`r2-media` acepta además prefijos históricos de R2 (`profile-media`, `music-media`) para conservar compatibilidad durante la migración.

## Variables canónicas

Las Edge Functions deben usar únicamente:

- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

No se deben añadir variables `HETZNER_S3_*` para media. El nginx del frontend tampoco sirve media persistente desde disco local o Hetzner.

## Migración histórica

El repositorio conserva workflows/documentación para copiar objetos históricos desde proveedores anteriores a R2. La migración de datos existente es una operación de infraestructura independiente del código de subida.

Antes de retirar un almacenamiento legado:

1. Ejecuta la migración en modo simulación.
2. Copia los objetos a R2.
3. Actualiza las referencias persistidas que todavía apunten al backend antiguo.
4. Verifica fotos, portadas, avatares, publicaciones, vídeos, música y chat.
5. Solo después retira el almacenamiento legado.
