-- Lock down existing tables with RLS, add subscription tracking, and define
-- a unified access rule: whitelisted (grandfathered) OR active/trialing subscription.

-- ---------------------------------------------------------------------------
-- profiles: each user can read/insert/update only their own row
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- check_ins: each user can manage only their own rows
-- ---------------------------------------------------------------------------
alter table public.check_ins enable row level security;

drop policy if exists "Users can view own check-ins" on public.check_ins;
create policy "Users can view own check-ins"
  on public.check_ins for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own check-ins" on public.check_ins;
create policy "Users can insert own check-ins"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own check-ins" on public.check_ins;
create policy "Users can update own check-ins"
  on public.check_ins for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own check-ins" on public.check_ins;
create policy "Users can delete own check-ins"
  on public.check_ins for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exercise_videos: readable by any authenticated user, writable only by admin
-- ---------------------------------------------------------------------------
alter table public.exercise_videos enable row level security;

drop policy if exists "Authenticated users can view exercise videos" on public.exercise_videos;
create policy "Authenticated users can view exercise videos"
  on public.exercise_videos for select
  to authenticated
  using (true);

drop policy if exists "Admin can manage exercise videos" on public.exercise_videos;
create policy "Admin can manage exercise videos"
  on public.exercise_videos for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com');

-- ---------------------------------------------------------------------------
-- whitelist: no direct client access (anon or authenticated). Only readable
-- via the security-definer has_access() function below, or the service role.
-- ---------------------------------------------------------------------------
alter table public.whitelist enable row level security;

-- ---------------------------------------------------------------------------
-- subscriptions: tracks Stripe subscription status per user
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text,
  current_period_end timestamptz,
  price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- has_access: true if the user's email is whitelisted (grandfathered beta
-- access) OR they have an active/trialing, non-expired subscription.
-- ---------------------------------------------------------------------------
create or replace function public.has_access(check_user_id uuid, check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.whitelist w where w.email = check_email)
    or exists (
      select 1 from public.subscriptions s
      where s.user_id = check_user_id
        and s.status in ('active', 'trialing')
        and (s.current_period_end is null or s.current_period_end > now())
    );
$$;

grant execute on function public.has_access(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- handle_new_user: auto-create a profiles row for new signups, since
-- favourites (Favourites.jsx, ExerciseFlow.jsx) update profiles.liked_exercises.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
exception
  -- Never block signup if the profiles insert fails for an unexpected reason
  -- (e.g. an additional required column). The frontend falls back to an
  -- upsert on first login.
  when others then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
