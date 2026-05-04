
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

-- Questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  type text not null default 'logical',
  options jsonb not null,
  correct_answer text not null,
  created_at timestamptz not null default now()
);
alter table public.questions enable row level security;
create policy "auth read questions" on public.questions for select to authenticated using (true);

-- Decisions
create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  human_answer text not null,
  human_confidence int not null,
  human_reasoning text,
  ai_answer text,
  ai_confidence int,
  ai_reasoning text,
  correct_answer text not null,
  human_correct boolean not null,
  ai_correct boolean,
  time_taken_ms int not null,
  agreement boolean,
  result text,
  created_at timestamptz not null default now()
);
alter table public.decisions enable row level security;
create policy "own decisions select" on public.decisions for select using (auth.uid() = user_id);
create policy "own decisions insert" on public.decisions for insert with check (auth.uid() = user_id);
create policy "own decisions update" on public.decisions for update using (auth.uid() = user_id);

create index decisions_user_created on public.decisions(user_id, created_at desc);

-- Seed sample questions
insert into public.questions (question_text, type, options, correct_answer) values
('A train traveling at 60 mph leaves Station A at 9:00 AM. Another train at 90 mph leaves Station B (180 miles away) toward A at 9:00 AM. At what time do they meet?', 'logical', '["10:12 AM","10:00 AM","11:00 AM","9:45 AM"]', '10:12 AM'),
('All bloops are razzies. All razzies are lazzies. Therefore, all bloops are definitely:', 'logical', '["lazzies","razzies only","not lazzies","unknown"]', 'lazzies'),
('A runaway trolley will kill 5 people. You can pull a lever to divert it to a track where it will kill 1 person. What is the utilitarian choice?', 'ethical', '["Pull the lever","Do nothing","Jump in front","Call for help"]', 'Pull the lever'),
('You find a wallet with $500 and an ID. The most ethical action is to:', 'ethical', '["Return it to the owner","Keep the money","Turn in to police only","Leave it where you found it"]', 'Return it to the owner'),
('Your startup has 6 months runway and a feature would take 4 months but only has 30% chance of doubling revenue. The risk-balanced choice is:', 'scenario', '["Build a smaller MVP version first","Build the full feature","Skip it entirely","Raise more funding first"]', 'Build a smaller MVP version first'),
('If today is Wednesday, what day will it be 100 days from now?', 'logical', '["Friday","Thursday","Saturday","Sunday"]', 'Friday'),
('A doctor can save 5 patients by harvesting organs from 1 healthy patient. Most ethical frameworks say:', 'ethical', '["Do not harvest","Harvest the organs","Ask the healthy patient","Flip a coin"]', 'Do not harvest'),
('You are offered: (A) $100 guaranteed, or (B) 50% chance of $250. Expected-value optimal choice is:', 'scenario', '["B","A","Indifferent","Neither"]', 'B');
