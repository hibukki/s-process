create table if not exists fundable_orgs (
  id bigint primary key generated always as identity,
  name text not null,
  created_at timestamptz default now()
);