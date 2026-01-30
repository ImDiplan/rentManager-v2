-- Create keep_alive table for activity tracking
create table if not exists keep_alive (
  id integer primary key,
  last_ping timestamp with time zone default now()
);

-- Add RLS policy (optional but recommended)
alter table keep_alive enable row level security;

-- Allow service role to update
create policy "Allow service role to update keep_alive"
  on keep_alive
  for update
  using (true)
  with check (true);

-- Allow service role to insert
create policy "Allow service role to insert keep_alive"
  on keep_alive
  for insert
  with check (true);
