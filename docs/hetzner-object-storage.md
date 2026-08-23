# Hetzner Object Storage

Inkorium uses Supabase for authentication and PostgreSQL data, and Hetzner Object Storage for media bytes.

## Supabase Edge Function secrets

Configure these secrets in the `r2-media` Edge Function:

- `HETZNER_S3_ENDPOINT=https://hel1.your-objectstorage.com`
- `HETZNER_S3_REGION=hel1`
- `HETZNER_S3_BUCKET=inkorium-media`
- `HETZNER_S3_ACCESS_KEY_ID=<secret>`
- `HETZNER_S3_SECRET_ACCESS_KEY=<secret>`
- Optional: `HETZNER_S3_PUBLIC_BASE_URL=https://inkorium-media.hel1.your-objectstorage.com`

The frontend keeps the existing `r2-media` function name for compatibility while the function now talks to Hetzner Object Storage.

## Bucket access

Use public read-only visibility for media that must be rendered directly by browser URLs. Write/delete access remains protected by S3 credentials and the Supabase-authenticated Edge Function.

Configure bucket CORS to allow the production origins (`https://inkorium.es` and `https://www.inkorium.es`) and `PUT`, `GET`, `HEAD` methods with the required headers.
