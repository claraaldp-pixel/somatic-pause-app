-- exercises: stores all somatic practice content
create table public.exercises (
  id               text primary key,
  survival_state   text    not null,
  category         text    not null,
  category_emoji   text,
  category_order   int     not null,
  exercise_order   int     not null,
  title            text    not null,
  duration         text,
  type             text,
  emoji            text,
  description      text,
  steps            jsonb   not null default '[]',
  phases           jsonb,
  rounds           int
);

alter table public.exercises enable row level security;

create policy "Authenticated users can view exercises"
  on public.exercises for select
  to authenticated
  using (true);

create policy "Admin can manage exercises"
  on public.exercises for all
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com');

-- symptom_categories: physical / emotional / thoughts / behavioural
create table public.symptom_categories (
  id            text primary key,
  label         text not null,
  emoji         text,
  description   text,
  display_order int  not null
);

alter table public.symptom_categories enable row level security;

create policy "Authenticated users can view symptom categories"
  on public.symptom_categories for select
  to authenticated
  using (true);

create policy "Admin can manage symptom categories"
  on public.symptom_categories for all
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com');

-- symptoms: the symptom sentences + scoring weights (core IP)
create table public.symptoms (
  id            serial primary key,
  category_id   text references public.symptom_categories(id) on delete cascade,
  text          text not null,
  fight_score   int  not null default 0,
  flight_score  int  not null default 0,
  freeze_score  int  not null default 0,
  fawn_score    int  not null default 0,
  display_order int  not null
);

alter table public.symptoms enable row level security;

create policy "Authenticated users can view symptoms"
  on public.symptoms for select
  to authenticated
  using (true);

create policy "Admin can manage symptoms"
  on public.symptoms for all
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com');
