# r2-media (legacy compatibility)

`r2-media` is kept temporarily so existing clients and deployed integrations do not break. It is **not** a Cloudflare R2 endpoint.

The function talks to the canonical **Hetzner Object Storage** backend using the `HETZNER_S3_*` secrets.

New application code should use the `media-storage` Edge Function through `src/lib/storage.ts`.

Required Supabase Edge Function secrets:

- `HETZNER_S3_ENDPOINT`
- `HETZNER_S3_REGION`
- `HETZNER_S3_ACCESS_KEY_ID`
- `HETZNER_S3_SECRET_ACCESS_KEY`
- `HETZNER_S3_BUCKET`
- `HETZNER_S3_PUBLIC_BASE_URL`

The old function name is retained only for backwards compatibility. No Cloudflare R2 credentials are required for this function.
