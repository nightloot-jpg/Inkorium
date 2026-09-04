-- Profile fields used by the existing profile editor but missing from public.profiles.
-- Adding them is backward-compatible and lets edits persist for every user/device.
alter table public.profiles
  add column if not exists relationship_status text,
  add column if not exists occupation text,
  add column if not exists music text,
  add column if not exists gender text,
  add column if not exists country text,
  add column if not exists province text;

-- Keep the public profile read policy unchanged. These columns are covered by the
-- existing SELECT policy on public.profiles.
