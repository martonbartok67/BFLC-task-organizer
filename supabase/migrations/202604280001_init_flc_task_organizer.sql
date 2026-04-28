-- FLC Task Organizer v1
-- Single-team workspace with pending approval flow and active-user-only data access.

create extension if not exists "pgcrypto";

create type public.user_status as enum ('pending', 'active', 'rejected');
create type public.task_status as enum ('backlog', 'todo', 'in_progress', 'review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'critical');
create type public.attachment_type as enum ('file', 'link');
create type public.activity_type as enum (
  'project_created',
  'task_created',
  'task_updated',
  'task_moved',
  'comment_added',
  'subtask_toggled',
  'attachment_added',
  'calendar_synced'
);
create type public.calendar_provider as enum ('google');
create type public.calendar_sync_direction as enum ('task_to_google', 'google_to_task');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  status public.user_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key public.task_status not null,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique(project_id, key)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  column_id uuid not null references public.board_columns(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  assignee_id uuid references public.profiles(id),
  due_date timestamptz,
  start_date timestamptz,
  position integer not null default 0,
  is_milestone boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_column_id on public.tasks(column_id);
create index if not exists idx_tasks_assignee_id on public.tasks(assignee_id);

create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_subtasks_task_id on public.subtasks(task_id);

create trigger subtasks_set_updated_at
before update on public.subtasks
for each row
execute function public.set_updated_at();

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  mentions text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_task_comments_task_id on public.task_comments(task_id);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  label text not null,
  type public.attachment_type not null,
  storage_path text,
  url text,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint task_attachments_source_check
    check (
      (type = 'file' and storage_path is not null)
      or
      (type = 'link' and url is not null)
    )
);

create index if not exists idx_task_attachments_task_id on public.task_attachments(task_id);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  activity_type public.activity_type not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_activity_events_project_id on public.activity_events(project_id);
create index if not exists idx_activity_events_task_id on public.activity_events(task_id);
create index if not exists idx_activity_events_created_at on public.activity_events(created_at desc);

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  provider public.calendar_provider not null default 'google',
  calendar_id text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz,
  sync_token text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger calendar_connections_set_updated_at
before update on public.calendar_connections
for each row
execute function public.set_updated_at();

create table if not exists public.calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade unique,
  calendar_connection_id uuid not null references public.calendar_connections(id) on delete cascade,
  external_event_id text not null,
  last_sync_direction public.calendar_sync_direction not null default 'task_to_google',
  last_synced_at timestamptz not null default timezone('utc', now()),
  unique(calendar_connection_id, external_event_id)
);

create index if not exists idx_calendar_event_links_external on public.calendar_event_links(external_event_id);

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  email text not null,
  note text,
  status public.user_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger access_requests_set_updated_at
before update on public.access_requests
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  initial_status public.user_status := 'pending';
begin
  if not exists (select 1 from public.profiles where status = 'active') then
    initial_status := 'active';
  end if;

  insert into public.profiles (id, email, full_name, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    initial_status
  )
  on conflict (id) do nothing;

  insert into public.access_requests (user_id, email, status)
  values (new.id, coalesce(new.email, ''), initial_status)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_active_user(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = uid
      and p.status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.board_columns enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.activity_events enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_event_links enable row level security;
alter table public.access_requests enable row level security;

create policy "profile_self_read"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_active_user(auth.uid()));

create policy "profile_self_update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "active_users_can_approve_profiles"
on public.profiles
for update
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_projects"
on public.projects
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_project_members"
on public.project_members
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_board_columns"
on public.board_columns
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_tasks"
on public.tasks
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_subtasks"
on public.subtasks
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_comments"
on public.task_comments
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_attachments"
on public.task_attachments
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_activity"
on public.activity_events
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_calendar_connections"
on public.calendar_connections
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "active_users_full_calendar_links"
on public.calendar_event_links
for all
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

create policy "access_request_read_own_or_active"
on public.access_requests
for select
to authenticated
using (auth.uid() = user_id or public.is_active_user(auth.uid()));

create policy "access_request_insert_own"
on public.access_requests
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "access_request_update_active"
on public.access_requests
for update
to authenticated
using (public.is_active_user(auth.uid()))
with check (public.is_active_user(auth.uid()));

-- Storage bucket policies (run after creating `task-attachments` bucket)
create policy "active_users_upload_task_attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-attachments'
  and public.is_active_user(auth.uid())
);

create policy "active_users_read_task_attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-attachments'
  and public.is_active_user(auth.uid())
);

create policy "active_users_update_task_attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'task-attachments'
  and public.is_active_user(auth.uid())
)
with check (
  bucket_id = 'task-attachments'
  and public.is_active_user(auth.uid())
);

create policy "active_users_delete_task_attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'task-attachments'
  and public.is_active_user(auth.uid())
);
