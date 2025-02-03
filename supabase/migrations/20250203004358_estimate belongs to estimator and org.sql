alter table marginal_utility_estimates
  add column org_id bigint not null references fundable_orgs(id),
  add column estimator_id uuid not null references auth.users(id),
  add constraint marginal_utility_estimates_org_id_estimator_id_key unique (org_id, estimator_id);