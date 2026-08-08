alter table public.entrol_leads
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists owner text,
  add column if not exists first_contacted_at timestamptz,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists internal_notes text,
  add column if not exists lost_reason text;

create or replace function public.set_entrol_lead_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_entrol_lead_updated_at on public.entrol_leads;
create trigger set_entrol_lead_updated_at
before update on public.entrol_leads
for each row execute function public.set_entrol_lead_updated_at();

create index if not exists entrol_leads_follow_up_idx
  on public.entrol_leads (next_follow_up_at)
  where status in ('new', 'contacted', 'qualified');

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
  notification_provider_id
from public.entrol_leads;

revoke all on public.entrol_lead_dashboard from anon, authenticated;
revoke execute on function public.set_entrol_lead_updated_at() from public, anon, authenticated;

comment on view public.entrol_lead_dashboard is
  'Admin-only Entrol lead pipeline view with response SLA and follow-up status.';

