alter table public.entrol_leads
  add column if not exists business_unit text not null default 'pet_products'
    check (business_unit in ('pet_products', 'socks')),
  add column if not exists source_site text not null default 'www.entrol.com'
    check (source_site in ('www.entrol.com', 'entrol.com', 'socks.entrol.com'));

comment on column public.entrol_leads.business_unit is
  'Server-derived Entrol business unit. The public form payload is not authoritative.';

comment on column public.entrol_leads.source_site is
  'Server-derived source site selected from the allowlisted HTTP Origin.';

create index if not exists entrol_leads_business_unit_created_at_idx
  on public.entrol_leads (business_unit, created_at desc);

create or replace view public.entrol_lead_dashboard
with (security_invoker = true)
as
select
  id,
  created_at,
  updated_at,
  status,
  case
    when status = 'new' and created_at < now() - interval '24 hours' then 'overdue'
    when status = 'new' and created_at < now() - interval '4 hours' then 'due_soon'
    when next_follow_up_at is not null and next_follow_up_at < now() then 'follow_up_due'
    else 'on_track'
  end as sla_status,
  extract(epoch from (now() - created_at))::bigint / 3600 as lead_age_hours,
  submission_type,
  name,
  company,
  email,
  contact,
  product_interest,
  quantity,
  target_market,
  message,
  owner,
  first_contacted_at,
  last_contacted_at,
  next_follow_up_at,
  internal_notes,
  lost_reason,
  source_page,
  landing_page,
  referrer,
  utm_source,
  utm_medium,
  utm_campaign,
  notification_status,
  notification_provider_id,
  utm_content,
  utm_term,
  catalog_touch_page,
  catalog_touch_placement,
  catalog_touched_at,
  inquiry_trigger,
  business_unit,
  source_site
from public.entrol_leads;

revoke all on public.entrol_lead_dashboard from anon, authenticated;

comment on view public.entrol_lead_dashboard is
  'Admin-only Entrol lead pipeline view with trusted business routing, response SLA, follow-up status, and conversion attribution.';
