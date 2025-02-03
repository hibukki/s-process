create table if not exists marginal_utility_estimates (
  id bigint primary key generated always as identity,
  created_at timestamptz default now()
);