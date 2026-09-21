begin;
create schema if not exists private;
revoke all on schema private from public;
create table public.administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.administrators enable row level security;
revoke all on public.administrators from anon, authenticated;
create function public.is_admin() returns boolean language sql stable security definer
set search_path = '' as $$ select exists(select 1 from public.administrators where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create function public.valid_web_url(value text) returns boolean language sql immutable
set search_path = '' as $$ select value is null or (length(value) <= 2048 and value ~ '^https?://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?([/?#][^[:space:]\\]*)?$' and value !~ '[[:cntrl:]]') $$;
create function public.valid_review_url(value text) returns boolean language sql immutable
set search_path = '' as $$ select value is null or (public.valid_web_url(value) and (value ~ '^https://g\.page/r/[^/?#]+/review/?([?#].*)?$' or value ~ '^https://search\.google\.com/local/writereview\?placeid=[A-Za-z0-9_-]+$')) $$;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null unique check (length(slug) between 1 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check(length(description) <= 1000),
  logo_url text check(public.valid_web_url(logo_url)),
  cover_url text check(public.valid_web_url(cover_url)),
  primary_color text not null default '#245b47' check(primary_color ~ '^#[0-9a-fA-F]{6}$'),
  google_review_url text check(public.valid_review_url(google_review_url)),
  status text not null default 'draft' check(status in ('draft', 'published', 'inactive')),
  first_published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.business_actions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null check(type in ('website','menu','catalog','instagram','facebook','whatsapp','phone','directions')),
  title text not null default '' check(length(title) <= 120),
  subtitle text not null default '' check(length(subtitle) <= 240),
  url text,
  phone_number text,
  message text not null default '' check(length(message) <= 1000),
  enabled boolean not null default true,
  position integer not null check(position between 0 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, position),
  check ((type in ('phone','whatsapp') and url is null and phone_number is not null and phone_number ~ '^\+[1-9][0-9]{6,14}$') or
    (type not in ('phone','whatsapp') and url is not null and public.valid_web_url(url) and phone_number is null))
);
create index businesses_public on public.businesses(status, slug);
create index actions_business on public.business_actions(business_id, position);
create function private.business_guard() returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if old.first_published_at is not null and new.slug <> old.slug then raise exception 'Slug locked after first publication'; end if;
    new.first_published_at := old.first_published_at;
  else new.first_published_at := null;
  end if;
  if new.status = 'published' and new.first_published_at is null then new.first_published_at := now(); end if;
  new.updated_at := now();
  return new;
end $$;
create trigger business_guard before insert or update on public.businesses for each row execute function private.business_guard();
alter table public.businesses enable row level security;
alter table public.business_actions enable row level security;
revoke all on public.businesses, public.business_actions from anon, authenticated;
grant select on public.businesses, public.business_actions to anon, authenticated;
grant select on public.businesses, public.business_actions to service_role;
grant insert, update, delete on public.businesses, public.business_actions to authenticated;
create policy business_read on public.businesses for select to anon, authenticated using(status = 'published' or public.is_admin());
create policy business_admin on public.businesses for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy action_read on public.business_actions for select to anon, authenticated using(public.is_admin() or (enabled and exists(select 1 from public.businesses b where b.id = business_id and b.status = 'published')));
create policy action_admin on public.business_actions for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- SECURITY INVOKER: table grants and RLS apply in addition to the explicit guard.
create function public.save_business(p_business jsonb, p_actions jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare bid uuid := coalesce((p_business->>'id')::uuid, gen_random_uuid()); item jsonb; idx integer := 0;
begin
  if not public.is_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  if jsonb_typeof(p_actions) <> 'array' or jsonb_array_length(p_actions) > 100 then raise exception 'Invalid actions'; end if;
  insert into public.businesses(id,name,slug,description,logo_url,cover_url,primary_color,google_review_url,status)
  values(bid,p_business->>'name',p_business->>'slug',coalesce(p_business->>'description',''),nullif(p_business->>'logo_url',''),nullif(p_business->>'cover_url',''),p_business->>'primary_color',nullif(p_business->>'google_review_url',''),p_business->>'status')
  on conflict(id) do update set name=excluded.name,slug=excluded.slug,description=excluded.description,logo_url=excluded.logo_url,cover_url=excluded.cover_url,primary_color=excluded.primary_color,google_review_url=excluded.google_review_url,status=excluded.status;
  delete from public.business_actions where business_id = bid;
  for item in select value from jsonb_array_elements(p_actions) loop
    insert into public.business_actions(id,business_id,type,title,subtitle,url,phone_number,message,enabled,position)
    values(coalesce((item->>'id')::uuid,gen_random_uuid()),bid,item->>'type',coalesce(item->>'title',''),coalesce(item->>'subtitle',''),nullif(item->>'url',''),nullif(item->>'phone_number',''),coalesce(item->>'message',''),coalesce((item->>'enabled')::boolean,true),idx);
    idx := idx + 1;
  end loop;
  return bid;
end $$;
revoke all on function public.save_business(jsonb,jsonb) from public, anon;
grant execute on function public.save_business(jsonb,jsonb) to authenticated;

create table public.interaction_events (
  event_id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check(kind in ('open','click')),
  action_key text not null check(length(action_key) <= 40),
  source text not null check(source in ('qr','nfc','direct')),
  occurred_at timestamptz not null default now(),
  check((kind='open' and action_key='page') or (kind='click' and action_key <> 'page'))
);
create index events_business_date on public.interaction_events(business_id,occurred_at);
alter table public.interaction_events enable row level security;
revoke all on public.interaction_events from anon, authenticated;
grant select on public.interaction_events to authenticated;
create policy events_admin on public.interaction_events for select to authenticated using(public.is_admin());

-- A database counter is shared across function instances; no IP or fingerprint is retained.
create table private.rate_windows (business_id uuid references public.businesses(id) on delete cascade, bucket timestamptz, requests integer not null, primary key(business_id,bucket));
create function public.record_event(p_event uuid,p_business uuid,p_kind text,p_action text,p_source text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if not exists(select 1 from public.businesses where id=p_business and status='published') then return false; end if;
  if p_kind = 'click' and p_action <> 'review' and not exists(select 1 from public.business_actions where business_id=p_business and id::text=p_action and enabled) then return false; end if;
  if p_kind = 'click' and p_action = 'review' and not exists(select 1 from public.businesses where id=p_business and google_review_url is not null) then return false; end if;
  if exists(select 1 from public.interaction_events where event_id=p_event) then return true; end if;
  insert into private.rate_windows values(p_business,date_trunc('minute',now()),1)
    on conflict(business_id,bucket) do update set requests=private.rate_windows.requests+1 returning requests into n;
  delete from private.rate_windows where business_id=p_business and bucket < now()-interval '2 minutes';
  if n > 120 then return false; end if;
  insert into public.interaction_events(event_id,business_id,kind,action_key,source)
    values(p_event,p_business,p_kind,p_action,p_source) on conflict(event_id) do nothing;
  return true;
end $$;
revoke all on function public.record_event(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.record_event(uuid,uuid,text,text,text) to service_role;

create function public.business_statistics(p_business uuid,p_from date,p_to date) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  if p_from is null or p_to is null or p_to < p_from or p_to-p_from >= 366 then raise exception 'Choose up to 366 days'; end if;
  with filtered as (
    select *, (occurred_at at time zone 'Europe/Rome')::date as day from public.interaction_events
    where business_id=p_business and occurred_at >= (p_from::timestamp at time zone 'Europe/Rome') and occurred_at < ((p_to+1)::timestamp at time zone 'Europe/Rome')
  ) select jsonb_build_object(
    'opens',(select count(*) from filtered where kind='open'),
    'sources',(select coalesce(jsonb_object_agg(source,n),'{}') from (select source,count(*) n from filtered where kind='open' group by source) s),
    'clicks',(select coalesce(jsonb_object_agg(action_key,n),'{}') from (select action_key,count(*) n from filtered where kind='click' group by action_key) c),
    'daily',(select coalesce(jsonb_agg(d order by day),'[]') from (select day,count(*) filter(where kind='open') opens,count(*) filter(where kind='click') clicks from filtered group by day) d)
  ) into result;
  return result;
end $$;
revoke all on function public.business_statistics(uuid,date,date) from public, anon;
grant execute on function public.business_statistics(uuid,date,date) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('business-images','business-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy images_admin on storage.objects for all to authenticated
using(bucket_id='business-images' and public.is_admin()) with check(bucket_id='business-images' and public.is_admin());
commit;
