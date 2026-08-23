# R2 photo storage

The photo uploader now obtains a signed PUT URL from the `r2-media` Edge Function and uploads directly to Cloudflare R2. Configure `R2_PUBLIC_BASE_URL` on the function to the bucket's public/custom-domain base URL.
