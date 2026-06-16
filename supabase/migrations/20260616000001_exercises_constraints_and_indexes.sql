-- Add check constraint on survival_state
alter table public.exercises
  add constraint exercises_survival_state_check
  check (survival_state in ('fight','flight','freeze','fawn','safe'));

-- Add index for the hot query path (filter by survival_state)
create index on public.exercises (survival_state);

-- Add composite index for symptom fetch order
create index on public.symptoms (category_id, display_order);

-- Fix nullable category_id (no data exists yet, safe to add NOT NULL)
alter table public.symptoms
  alter column category_id set not null;
