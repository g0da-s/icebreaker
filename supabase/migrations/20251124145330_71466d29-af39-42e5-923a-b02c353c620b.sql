-- Create profiles table with role column
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null check (role in ('student', 'faculty', 'staff')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies for user access
create policy "Users can view their own profile" 
on public.profiles 
for select 
using (auth.uid() = id);

create policy "Users can update their own profile" 
on public.profiles 
for update 
using (auth.uid() = id);

-- Create function to auto-assign role based on email domain
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role text;
begin
  -- Determine role based on email domain
  if new.email like '%@stud.ism.lt' then
    user_role := 'student';
  elsif new.email like '%@faculty.ism.lt' then
    user_role := 'faculty';
  elsif new.email like '%@ism.lt' then
    user_role := 'staff';
  else
    user_role := 'staff'; -- default fallback
  end if;

  -- Insert profile with auto-assigned role
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    user_role
  );
  return new;
end;
$$;

-- Create trigger to run after user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Create trigger for automatic timestamp updates
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();