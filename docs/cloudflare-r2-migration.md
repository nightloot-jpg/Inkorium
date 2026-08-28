# Historical Cloudflare R2 migration

This document is retained only as a historical record of an earlier storage architecture.

## Current architecture

Inkorium now uses **Hetzner Object Storage as the single canonical persistent media backend**. Supabase remains responsible for Auth and PostgreSQL metadata.

Do not use the old `R2_*` environment variables for the active media path.

## Historical note

An earlier version of Inkorium migrated media toward Cloudflare R2. That architecture was subsequently replaced by Hetzner Object Storage. The repository may still contain historical migration workflows, old function names and `r2://` data identifiers for backwards compatibility.

Those names must not be interpreted as evidence that Cloudflare is still an active media provider.

## Current entry point

New frontend code should use `src/lib/storage.ts`, which calls the `media-storage` Supabase Edge Function. That function signs uploads, reads and deletes against Hetzner using the `HETZNER_S3_*` secrets.

Historical migration scripts are not part of the runtime storage path and should only be used for data archaeology or one-off migrations with explicit review.
