-- Track transactional email so each confirmation/notification is sent at most once.
alter table public.registrations add column if not exists confirmation_sent_at timestamptz;
alter table public.contact_messages add column if not exists notified_at timestamptz;
