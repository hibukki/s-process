create table if not exists utility_graph_points (
  id bigint primary key generated always as identity,
  marginal_utility_estimate_id bigint not null references marginal_utility_estimates(id),
  created_at timestamptz default now(),
  usd_amount bigint not null,
  utilons bigint not null
);