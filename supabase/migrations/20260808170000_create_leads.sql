create table if not exists public.entrol_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost', 'spam')),
  request_id uuid not null unique,
  submission_type text not null default 'inquiry' check (submission_type in ('inquiry', 'catalog')),
  name text,
  email text,
  contact text,
  company text,
  product_interest text,
  quantity text,
  target_market text,
  message text,
  source_page text,
  landing_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  user_agent text,
  raw_payload jsonb not null default '{}'::jsonb,
  constraint leads_contact_required check (
    nullif(btrim(coalesce(email, '')), '') is not null
    or nullif(btrim(coalesce(contact, '')), '') is not null
  )
);

comment on table public.entrol_leads is 'Durable first-party capture for Entrol website inquiries and catalog requests; isolated from CardRealm objects.';

create index if not exists entrol_leads_created_at_idx on public.entrol_leads (created_at desc);
create index if not exists entrol_leads_status_created_at_idx on public.entrol_leads (status, created_at desc);
create index if not exists entrol_leads_email_idx on public.entrol_leads (lower(email)) where email is not null;
create index if not exists entrol_leads_utm_campaign_idx on public.entrol_leads (utm_campaign) where utm_campaign is not null;

alter table public.entrol_leads enable row level security;
alter table public.entrol_leads force row level security;

revoke all on table public.entrol_leads from anon, authenticated;
