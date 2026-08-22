alter table public.entrol_leads
  drop constraint if exists entrol_leads_business_unit_check,
  drop constraint if exists entrol_leads_source_site_check;

alter table public.entrol_leads
  add constraint entrol_leads_business_unit_check
    check (business_unit in ('pet_products', 'socks', 'kjadehome')),
  add constraint entrol_leads_source_site_check
    check (source_site in ('www.entrol.com', 'entrol.com', 'socks.entrol.com', 'www.kjadehome.com', 'kjadehome.com'));

comment on column public.entrol_leads.business_unit is
  'Server-assigned business line: pet_products, socks, or kjadehome.';

comment on column public.entrol_leads.source_site is
  'Server-assigned source host derived from the allowlisted request Origin.';
