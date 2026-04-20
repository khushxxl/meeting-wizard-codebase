-- API keys used by the Chrome extension to authenticate uploads.
-- Full key is shown to the user exactly once; only its sha256 hash is stored.
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Chrome Extension',
  prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists api_keys_user_id_idx on public.api_keys(user_id);
create index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);

alter table public.api_keys enable row level security;

create policy "Users can view their own api keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can create their own api keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own api keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- Extra meeting fields for uploaded recordings
alter table public.meetings add column if not exists audio_url text;
alter table public.meeting_notes add column if not exists raw_transcript text;

-- Private storage bucket for audio recordings.
-- Files are written under `<user_id>/<meeting_id>.webm`.
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

create policy "Users can read their own recordings"
  on storage.objects for select
  using (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload their own recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own recordings"
  on storage.objects for delete
  using (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
