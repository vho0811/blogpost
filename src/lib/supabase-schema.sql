-- Enable Row Level Security
alter table if exists public.users enable row level security;
alter table if exists public.blog_posts enable row level security;
alter table if exists public.design_history enable row level security;
alter table if exists public.design_templates enable row level security;

-- Users table (extends Clerk user data)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  username text,
  first_name text,
  last_name text,
  profile_image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Blog posts table
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  subtitle text,
  content text not null,
  excerpt text,
  featured_image_url text,
  category text default 'General',
  tags text[],
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  slug text unique not null,
  read_time integer,
  views integer default 0,
  likes integer default 0,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  seo_title text,
  seo_description text,
  seo_keywords text[],
  html_code TEXT,
  css_styles TEXT,
  design_theme TEXT,
  design_prompt TEXT,
  is_custom_designed BOOLEAN DEFAULT FALSE
);

-- Design history table (updated)
create table if not exists public.design_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  blog_post_id uuid references public.blog_posts(id) on delete cascade,
  design_prompt text not null,
  target_file text not null,
  generated_code jsonb,
  applied_at timestamp with time zone default now(),
  success boolean default true,
  ai_model text default 'claude-3-5-sonnet-20241022',
  design_metadata jsonb
);

-- Design templates table (updated)
create table if not exists public.design_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  description text,
  prompt text not null,
  code_structure jsonb,
  preview_image_url text,
  category text default 'General',
  is_public boolean default false,
  usage_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid references public.blog_posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  content text not null,
  is_approved boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Media files table
create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size integer,
  alt_text text,
  created_at timestamp with time zone default now()
);

-- Blog analytics table
create table if not exists public.blog_analytics (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid references public.blog_posts(id) on delete cascade,
  user_id uuid references public.users(id),
  event_type text not null check (event_type in ('view', 'like', 'share', 'comment')),
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_blog_posts_user_id on public.blog_posts(user_id);
create index if not exists idx_blog_posts_status on public.blog_posts(status);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_created_at on public.blog_posts(created_at desc);
create index if not exists idx_design_history_blog_post_id on public.design_history(blog_post_id);
create index if not exists idx_comments_blog_post_id on public.comments(blog_post_id);
create index if not exists idx_media_files_user_id on public.media_files(user_id);

-- Row Level Security Policies

-- Users policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid()::text = clerk_user_id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid()::text = clerk_user_id);

-- Blog posts policies
create policy "Anyone can view published blog posts"
  on public.blog_posts for select
  using (status = 'published');

create policy "Users can view their own blog posts"
  on public.blog_posts for select
  using (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

create policy "Users can insert their own blog posts"
  on public.blog_posts for insert
  with check (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

create policy "Users can update their own blog posts"
  on public.blog_posts for update
  using (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

create policy "Users can delete their own blog posts"
  on public.blog_posts for delete
  using (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

-- Design history policies
create policy "Users can view their own design history"
  on public.design_history for select
  using (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

create policy "Users can insert their own design history"
  on public.design_history for insert
  with check (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

-- Design templates policies
create policy "Anyone can view public design templates"
  on public.design_templates for select
  using (is_public = true);

create policy "Users can view their own design templates"
  on public.design_templates for select
  using (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

create policy "Users can insert their own design templates"
  on public.design_templates for insert
  with check (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

-- Comments policies
create policy "Anyone can view approved comments"
  on public.comments for select
  using (is_approved = true);

create policy "Users can insert comments"
  on public.comments for insert
  with check (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

-- Media files policies
create policy "Users can view their own media files"
  on public.media_files for select
  using (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

create policy "Users can insert their own media files"
  on public.media_files for insert
  with check (user_id in (select id from public.users where clerk_user_id = auth.uid()::text));

-- Functions

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
drop trigger if exists handle_updated_at on public.users;
create trigger handle_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

drop trigger if exists handle_updated_at on public.blog_posts;
create trigger handle_updated_at
  before update on public.blog_posts
  for each row execute function public.handle_updated_at();

drop trigger if exists handle_updated_at on public.design_templates;
create trigger handle_updated_at
  before update on public.design_templates
  for each row execute function public.handle_updated_at();

-- Function to generate slug from title
create or replace function public.generate_slug(title text)
returns text
language plpgsql
as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  );
end;
$$;

-- Function to calculate read time
create or replace function public.calculate_read_time(content text)
returns integer
language plpgsql
as $$
declare
  word_count integer;
  read_time integer;
begin
  -- Count words (approximate)
  word_count := array_length(string_to_array(regexp_replace(content, '<[^>]*>', '', 'g'), ' '), 1);
  -- Average reading speed: 200 words per minute
  read_time := ceil(word_count / 200.0);
  return greatest(read_time, 1);
end;
$$;

-- Enable real-time subscriptions
alter publication supabase_realtime add table public.blog_posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.blog_analytics;