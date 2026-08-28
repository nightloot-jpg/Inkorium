# media-storage

Canonical Inkorium media storage API.

This Supabase Edge Function is the single application gateway for persistent media stored in **Hetzner Object Storage**.

## Supported media

- photos
- covers
- avatars
- post-media
- videos
- music
- chat

## Required secrets

- `HETZNER_S3_ENDPOINT`
- `HETZNER_S3_REGION`
- `HETZNER_S3_ACCESS_KEY_ID`
- `HETZNER_S3_SECRET_ACCESS_KEY`
- `HETZNER_S3_BUCKET`
- `HETZNER_S3_PUBLIC_BASE_URL`

S3 credentials are server-side secrets and must never be exposed to the browser.

## Contract

The client authenticates through Supabase and asks this function for a presigned upload URL, a signed read URL or an authorized delete operation. The function validates the authenticated user before returning or executing the requested operation.

`src/lib/storage.ts` is the canonical browser client.

The old `r2-media` and `r2-video` function names are retained only as compatibility endpoints and now use the same Hetzner backend.
