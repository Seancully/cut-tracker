-- ============================================================
-- Sean's Cut — Supabase schema + Row Level Security
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run
-- Every table is locked to the logged-in user (auth.uid()), so even though the
-- site is public, nobody can read or write anyone else's data.
-- ============================================================

-- ---------- SETTINGS (one row per user) ----------
create table if not exists public.settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  cur_weight  numeric,
  goal_weight numeric,
  kcal        integer,
  protein     integer,
  cardio      integer,
  phase       text,
  notes       text,
  updated_at  timestamptz default now()
);

-- ---------- DAILY CHECKLIST (one row per user per day) ----------
create table if not exists public.daily_checks (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  day       date not null,
  yog       boolean default false,
  cal       boolean default false,
  pro       boolean default false,
  creatine  boolean default false,
  cardio    boolean default false,
  water     boolean default false,
  sleep     boolean default false,
  stress    boolean default false,
  weigh     boolean default false,
  unique (user_id, day)
);

-- ---------- WEIGH-INS (one row per user per day) ----------
create table if not exists public.weigh_ins (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null,
  weight   numeric not null,
  unique (user_id, day)
);

-- ---------- WORKOUTS (a training session) ----------
create table if not exists public.workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null default current_date,
  label      text,
  created_at timestamptz default now()
);

-- ---------- WORKOUT SETS (one logged set) ----------
create table if not exists public.workout_sets (
  id         uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  exercise   text not null,
  reps       integer,
  weight     numeric,
  position   integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_sets_user_exercise on public.workout_sets (user_id, exercise);
create index if not exists idx_workouts_user_day on public.workouts (user_id, day);

-- ---------- CARDIO LOGS (one row per cardio session; many per day allowed) ----------
create table if not exists public.cardio_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null default current_date,
  minutes    integer not null,
  kind       text,
  created_at timestamptz default now()
);

create index if not exists idx_cardio_user_day on public.cardio_logs (user_id, day);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.settings      enable row level security;
alter table public.daily_checks  enable row level security;
alter table public.weigh_ins     enable row level security;
alter table public.workouts      enable row level security;
alter table public.workout_sets  enable row level security;
alter table public.cardio_logs   enable row level security;

-- Helper: a single policy per table covering all actions for the owner.
do $$
declare t text;
begin
  foreach t in array array['settings','daily_checks','weigh_ins','workouts','workout_sets','cardio_logs']
  loop
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format(
      'create policy own_rows on public.%I
         for all
         using (user_id = auth.uid())
         with check (user_id = auth.uid());', t);
  end loop;
end $$;
