# Inkorium media storage

Hetzner Object Storage is the single canonical persistent media backend for Inkorium.

Supabase is used for Auth and PostgreSQL metadata. It is not the persistent object store for application media.

## Canonical architecture

```text
Browser
  -> Supabase Edge Function: media-storage
  -> Hetzner Object Storage
```

The browser never receives the Hetzner S3 credentials. The Edge Function authenticates the user, validates the requested object operation, generates a presigned URL and returns only the URL/key needed by the client.

## Media folders

The canonical bucket is `inkorium-media`, with these application prefixes:

- `photos/`
- `covers/`
- `avatars/`
- `post-media/`
- `videos/`
- `music/`
- `chat/`

Historical prefixes such as `profile-media/` and `music-media/` remain readable by the compatibility authorization path while old records are being retired.

## Supabase Edge Function secrets

Configure these secrets for `media-storage` and the legacy-compatible `r2-media`/`r2-video` functions:

- `HETZNER_S3_ENDPOINT=https://hel1.your-objectstorage.com`
- `HETZNER_S3_REGION=hel1`
- `HETZNER_S3_BUCKET=inkorium-media`
- `HETZNER_S3_ACCESS_KEY_ID=<secret>`
- `HETZNER_S3_SECRET_ACCESS_KEY=<secret>`
- `HETZNER_S3_PUBLIC_BASE_URL=https://media.example.com`

Use the real public/custom-domain value for `HETZNER_S3_PUBLIC_BASE_URL` in each environment.

## Client contract

New frontend code should import from `src/lib/storage.ts`:

- `createStorageUploadTicket`
- `uploadToPresignedUrl`
- `getStorageSignedUrl`
- `deleteStorageObject`

`src/lib/r2.ts` is intentionally retained as a compatibility shim for existing imports. Despite the historical filename, it no longer selects Cloudflare R2.

## Legacy cleanup

Cloudflare R2 references in historical migration files and old function names should not be interpreted as an active storage provider. Do not configure `R2_*` secrets for the canonical media path.

The old host-volume media server on `/data/inkorium-media` is also not part of the canonical object-storage path. Existing legacy files must be verified and migrated before removing any remaining host-volume data.
