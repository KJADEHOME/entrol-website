alter table public.entrol_leads
  add column if not exists notification_status text not null default 'pending'
    check (notification_status in ('pending', 'sent', 'failed', 'not_configured')),
  add column if not exists notification_provider text,
  add column if not exists notification_provider_id text,
  add column if not exists notification_attempted_at timestamptz,
  add column if not exists notification_error text;

create index if not exists entrol_leads_notification_status_idx
  on public.entrol_leads (notification_status, created_at desc);

