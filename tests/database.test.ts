import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('migration, RLS, atomic saves, immutable slugs, tracking and aggregates in local PostgreSQL', async () => {
  const db = new PGlite()
  const admin = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const outsider = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const published = '11111111-1111-4111-8111-111111111111'
  const draft = '22222222-2222-4222-8222-222222222222'
  try {
    // Only the Supabase-managed auth/storage scaffolding is emulated.
    // All application tables, functions, grants and policies come from the real migration.
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated,anon;
      grant all on storage.objects to authenticated,anon;
    `)
    await db.exec(await readFile('supabase/migrations/202609210001_core.sql', 'utf8'))
    await db.exec(`insert into auth.users values('${admin}'),('${outsider}'); insert into public.administrators(user_id) values('${admin}');
      insert into businesses(id,name,slug,status) values('${published}','Published','published','published'),('${draft}','Draft','draft','draft');
      insert into business_actions(id,business_id,type,url,position,enabled) values('33333333-3333-4333-8333-333333333333','${published}','website','https://example.com',0,true),('44444444-4444-4444-8444-444444444444','${published}','website','https://example.com',1,false);`)
    const count = async (table: string) => Number((await db.query<{ n: number }>(`select count(*) as n from ${table}`)).rows[0].n)
    await db.exec('set role anon')
    assert.equal(await count('businesses'), 1, 'anon cannot read drafts')
    assert.equal(await count('business_actions'), 1, 'anon cannot read disabled actions')
    await assert.rejects(db.exec(`insert into businesses(name,slug) values('x','x')`))
    await assert.rejects(db.exec(`select * from administrators`))
    await assert.rejects(db.exec(`select public.record_event(gen_random_uuid(),'${published}','open','page','qr')`))
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${outsider}',false)`)
    assert.equal((await db.query<{ is_admin: boolean }>('select is_admin()')).rows[0].is_admin, false)
    assert.equal(await count('businesses'), 1)
    await assert.rejects(db.exec(`insert into administrators(user_id) values('${outsider}')`))
    await assert.rejects(db.exec(`select business_statistics('${published}',current_date,current_date)`))
    await assert.rejects(db.exec(`select save_business('{}','[]')`))
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values('business-images','bad.png')`))
    await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false)`)
    assert.equal(await count('businesses'), 2)
    assert.equal(await count('business_actions'), 2)
    await db.exec(`insert into storage.objects(bucket_id,name) values('business-images','ok.png')`)
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name) values('another-bucket','no.png')`))
    await assert.rejects(db.exec(`insert into interaction_events values(gen_random_uuid(),'${published}','open','page','qr',now())`))
    await assert.rejects(db.exec(`update businesses set slug='changed' where id='${published}'`))
    await db.exec(`update businesses set status='draft',first_published_at=null where id='${published}'`)
    await assert.rejects(db.exec(`update businesses set slug='changed' where id='${published}'`))
    await db.exec(`update businesses set status='published' where id='${published}'`)
    const business = { id: draft, name: 'Changed', slug: 'draft', primary_color: '#123456', status: 'draft' }
    await assert.rejects(db.query('select save_business($1,$2)', [JSON.stringify(business), JSON.stringify([{ type: 'website', url: 'javascript:alert(1)' }])]))
    assert.equal((await db.query<{ name: string }>('select name from businesses where id=$1', [draft])).rows[0].name, 'Draft', 'invalid action rolls back business update')
    await assert.rejects(db.query('select save_business($1,$2)', [JSON.stringify(business), JSON.stringify([{ type: 'phone' }])]))
    await db.query('select save_business($1,$2)', [JSON.stringify(business), JSON.stringify([{ type: 'phone', phone_number: '+390212345678' }])])
    await db.exec('reset role; set role service_role')
    assert.equal(await count('businesses'), 2, 'server role can resolve records, endpoint must filter published')
    const event = '55555555-5555-4555-8555-555555555555'
    await db.exec(`select record_event('${event}','${published}','open','page','qr'); select record_event('${event}','${published}','open','page','qr');`)
    assert.equal((await db.query<{ record_event: boolean }>(`select record_event(gen_random_uuid(),'${draft}','open','page','direct')`)).rows[0].record_event, false)
    assert.equal((await db.query<{ record_event: boolean }>(`select record_event(gen_random_uuid(),'${published}','click','44444444-4444-4444-8444-444444444444','direct')`)).rows[0].record_event, false)
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false)`)
    assert.equal(await count('interaction_events'), 1, 'retry has only one event')
    const stats = await db.query<{ result: { opens: number; sources: { qr: number } } }>(`select business_statistics('${published}',(now() at time zone 'Europe/Rome')::date,(now() at time zone 'Europe/Rome')::date) result`)
    assert.equal(stats.rows[0].result.opens, 1)
    assert.equal(stats.rows[0].result.sources.qr, 1)
    await db.exec('reset role; set role service_role')
    await db.exec(`select record_event(gen_random_uuid(),'${published}','open','page','direct') from generate_series(1,120)`)
    assert.equal((await db.query<{ record_event: boolean }>(`select record_event(gen_random_uuid(),'${published}','open','page','direct')`)).rows[0].record_event, false, 'database rate cap enforced')
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false)`)
    assert.equal(await count('interaction_events'), 120)
  } finally { await db.close() }
})
