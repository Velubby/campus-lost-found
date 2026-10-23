do $$
begin
  create type public.report_type as enum ('hilang', 'temuan');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('draf', 'aktif', 'ditemukan', 'klaim', 'selesai');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.claim_status as enum ('diajukan', 'ditinjau', 'disetujui', 'ditolak');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  student_number text,
  faculty text,
  study_program text,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  location text not null,
  found_at timestamptz not null,
  image_url text,
  description text not null,
  private_notes text,
  status text not null default 'Ditemukan',
  source_report_id uuid unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  report_code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.report_type not null,
  item_title text not null,
  category text not null,
  location text not null,
  incident_at timestamptz not null,
  public_description text not null,
  private_description text,
  image_url text,
  contact_phone text not null,
  status public.report_status not null default 'aktif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  private_answers text not null,
  contact_phone text not null,
  status public.claim_status not null default 'diajukan',
  ticket_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  title text not null,
  description text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.reports add column if not exists image_url text;
alter table public.profiles add column if not exists student_number text;
alter table public.profiles add column if not exists faculty text;
alter table public.profiles add column if not exists study_program text;
alter table public.claims alter column report_id drop not null;
alter table public.items add column if not exists source_report_id uuid unique;
alter table public.items drop constraint if exists items_source_report_id_fkey;
alter table public.items add constraint items_source_report_id_fkey
  foreign key (source_report_id) references public.reports(id) on delete set null;

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.reports enable row level security;
alter table public.claims enable row level security;
alter table public.report_events enable row level security;

drop policy if exists "Profiles are visible to their owner" on public.profiles;
drop policy if exists "Users can create their profile" on public.profiles;
drop policy if exists "Users can update their profile" on public.profiles;
drop policy if exists "Anyone can browse found items" on public.items;
drop policy if exists "Authenticated users can browse found items" on public.items;
drop policy if exists "Users can create found items" on public.items;
drop policy if exists "Users can view their reports" on public.reports;
drop policy if exists "Users can create their reports" on public.reports;
drop policy if exists "Users can update their reports" on public.reports;
drop policy if exists "Users can delete their draft reports" on public.reports;
drop policy if exists "Users can view their claims" on public.claims;
drop policy if exists "Users can create their claims" on public.claims;
drop policy if exists "Report and item owners can view claims" on public.claims;
drop policy if exists "Users can view events for their reports" on public.report_events;

create policy "Profiles are visible to their owner"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can create their profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Anyone can browse found items"
  on public.items for select to anon, authenticated using (true);
create policy "Users can create found items"
  on public.items for insert to authenticated with check (auth.uid() = created_by);

create policy "Users can view their reports"
  on public.reports for select using (auth.uid() = user_id);
create policy "Users can create their reports"
  on public.reports for insert with check (auth.uid() = user_id);
create policy "Users can update their reports"
  on public.reports for update using (auth.uid() = user_id);
create policy "Users can delete their draft reports"
  on public.reports for delete using (auth.uid() = user_id and status = 'draf');

insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public item images are viewable" on storage.objects;
drop policy if exists "Users can upload item images" on storage.objects;
drop policy if exists "Users can update their item images" on storage.objects;
drop policy if exists "Users can delete their item images" on storage.objects;

create policy "Public item images are viewable"
  on storage.objects for select using (bucket_id = 'item-images');
create policy "Users can upload item images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update their item images"
  on storage.objects for update to authenticated
  using (bucket_id = 'item-images' and owner_id = auth.uid()::text);
create policy "Users can delete their item images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'item-images' and owner_id = auth.uid()::text);

create policy "Report and item owners can view claims"
  on public.claims for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.items
      where items.id = claims.item_id
        and items.created_by = auth.uid()
    )
    or exists (
      select 1 from public.reports
      where reports.id = claims.report_id
        and reports.user_id = auth.uid()
    )
  );
create policy "Users can create their claims"
  on public.claims for insert with check (auth.uid() = user_id);

create policy "Users can view events for their reports"
  on public.report_events for select using (
    exists (
      select 1 from public.reports
      where reports.id = report_events.report_id
        and reports.user_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, student_number, faculty, study_program)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Pengguna Kampus'),
    new.raw_user_meta_data ->> 'student_number',
    new.raw_user_meta_data ->> 'faculty',
    new.raw_user_meta_data ->> 'study_program'
  );
  return new;
end;
$$;

create or replace function public.publish_found_report()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.type = 'temuan' then
    insert into public.items (
      title, category, location, found_at, image_url, description,
      private_notes, status, source_report_id, created_by
    )
    values (
      new.item_title, new.category, new.location, new.incident_at,
      new.image_url, new.public_description, new.private_description,
      'Ditemukan', new.id, new.user_id
    )
    on conflict (source_report_id) do update set
      title = excluded.title,
      category = excluded.category,
      location = excluded.location,
      found_at = excluded.found_at,
      image_url = excluded.image_url,
      description = excluded.description,
      private_notes = excluded.private_notes,
      status = excluded.status;
  end if;
  return new;
end;
$$;

drop trigger if exists on_found_report_created on public.reports;
create trigger on_found_report_created
after insert on public.reports
for each row execute procedure public.publish_found_report();

create or replace function public.record_report_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.report_events (report_id, title, description, created_by)
  values (new.id, 'Laporan dibuat', 'Laporan berhasil diterima sistem.', new.user_id);
  return new;
end;
$$;

drop trigger if exists on_report_created_event on public.reports;
create trigger on_report_created_event
after insert on public.reports
for each row execute procedure public.record_report_created();

create or replace function public.record_report_status_changed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.report_events (report_id, title, description, created_by)
    values (
      new.id,
      'Status laporan diperbarui',
      'Status laporan berubah menjadi ' || new.status || '.',
      new.user_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_report_status_changed on public.reports;
create trigger on_report_status_changed
after update on public.reports
for each row execute procedure public.record_report_status_changed();

insert into public.report_events (report_id, title, description, created_by)
select report.id, 'Laporan dibuat', 'Laporan berhasil diterima sistem.', report.user_id
from public.reports report
where not exists (
  select 1 from public.report_events event
  where event.report_id = report.id
    and event.title = 'Laporan dibuat'
);

create or replace function public.handle_claim_submitted()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  found_report_id uuid;
begin
  update public.items
  set status = 'Menunggu Verifikasi'
  where id = new.item_id;

  select source_report_id
    into found_report_id
  from public.items
  where id = new.item_id;

  if found_report_id is not null then
    update public.reports
    set status = 'klaim', updated_at = now()
    where id = found_report_id;

    insert into public.report_events (report_id, title, description, created_by)
    values (
      found_report_id,
      'Klaim diajukan',
      'Ada pengguna yang mengajukan klaim kepemilikan. Petugas perlu memverifikasi ciri privatnya.',
      new.user_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_claim_submitted on public.claims;
create trigger on_claim_submitted
after insert on public.claims
for each row execute procedure public.handle_claim_submitted();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute procedure public.set_updated_at();

drop trigger if exists set_claims_updated_at on public.claims;
create trigger set_claims_updated_at
before update on public.claims
for each row execute procedure public.set_updated_at();

create or replace function public.sync_found_report_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.type = 'temuan' then
    update public.items
    set title = new.item_title,
        category = new.category,
        location = new.location,
        found_at = new.incident_at,
        image_url = new.image_url,
        description = new.public_description,
        private_notes = new.private_description,
        status = case
          when new.status = 'klaim' then 'Menunggu Verifikasi'
          when new.status = 'selesai' then 'Selesai'
          else status
        end
    where source_report_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_found_report_updated on public.reports;
create trigger on_found_report_updated
after update on public.reports
for each row execute procedure public.sync_found_report_update();

create or replace function public.handle_claim_updated()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  found_report_id uuid;
  next_item_status text;
  next_report_status public.report_status;
begin
  if new.status = old.status then
    return new;
  end if;

  next_item_status := case new.status
    when 'diajukan' then 'Menunggu Verifikasi'
    when 'ditinjau' then 'Menunggu Verifikasi'
    when 'disetujui' then 'Klaim Disetujui'
    when 'ditolak' then 'Ditemukan'
  end;

  update public.items
  set status = next_item_status
  where id = new.item_id;

  select source_report_id
    into found_report_id
  from public.items
  where id = new.item_id;

  if found_report_id is not null then
    next_report_status := case new.status
      when 'disetujui' then 'selesai'
      when 'ditolak' then 'ditemukan'
      else 'klaim'
    end;

    update public.reports
    set status = next_report_status
    where id = found_report_id;

    insert into public.report_events (report_id, title, description, created_by)
    values (
      found_report_id,
      'Status klaim diperbarui',
      'Status klaim berubah menjadi ' || new.status || '.',
      new.user_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_claim_updated on public.claims;
create trigger on_claim_updated
after update on public.claims
for each row execute procedure public.handle_claim_updated();

create or replace function public.remove_found_item_after_report_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.items where source_report_id = old.id;
  return old;
end;
$$;

drop trigger if exists on_found_report_deleted on public.reports;
create trigger on_found_report_deleted
after delete on public.reports
for each row execute procedure public.remove_found_item_after_report_delete();

update public.items
set status = 'Menunggu Verifikasi'
where id in (
  select item_id from public.claims
  where status in ('diajukan', 'ditinjau')
);

update public.reports
set status = 'klaim', updated_at = now()
where id in (
  select items.source_report_id
  from public.claims
  join public.items on items.id = claims.item_id
  where claims.status in ('diajukan', 'ditinjau')
    and items.source_report_id is not null
);

insert into public.report_events (report_id, title, description, created_by)
select distinct
  items.source_report_id,
  'Klaim diajukan',
  'Ada pengguna yang mengajukan klaim kepemilikan. Petugas perlu memverifikasi ciri privatnya.',
  claims.user_id
from public.claims
join public.items on items.id = claims.item_id
where claims.status in ('diajukan', 'ditinjau')
  and items.source_report_id is not null
  and not exists (
    select 1 from public.report_events
    where report_events.report_id = items.source_report_id
      and report_events.title = 'Klaim diajukan'
  );

insert into public.items (
  title, category, location, found_at, image_url, description,
  private_notes, status, source_report_id, created_by
)
select
  report.item_title, report.category, report.location, report.incident_at,
  report.image_url, report.public_description, report.private_description,
  'Ditemukan', report.id, report.user_id
from public.reports report
where report.type = 'temuan'
on conflict (source_report_id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();