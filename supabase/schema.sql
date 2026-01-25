-- ============================================
-- Next.js + Supabase Starter - Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Profiles Table
-- ============================================
-- Stores user profile information linked to Supabase Auth

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function: Automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at when profile is modified
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Indexes (for better query performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- Country Lists Table
-- ============================================
-- Stores named lists of countries for each user

CREATE TABLE public.country_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.country_lists IS 'Named lists of countries created by users';

-- Enable RLS on country_lists table
ALTER TABLE public.country_lists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own lists
CREATE POLICY "Users can view their own country lists"
  ON public.country_lists
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own lists
CREATE POLICY "Users can insert their own country lists"
  ON public.country_lists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own lists
CREATE POLICY "Users can update their own country lists"
  ON public.country_lists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own lists
CREATE POLICY "Users can delete their own country lists"
  ON public.country_lists
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: Update updated_at when country list is modified
DROP TRIGGER IF EXISTS update_country_lists_updated_at ON public.country_lists;
CREATE TRIGGER update_country_lists_updated_at
  BEFORE UPDATE ON public.country_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_country_lists_user_id ON public.country_lists(user_id);

-- ============================================
-- List Countries Table
-- ============================================
-- Stores countries that belong to a list with optional notes

CREATE TABLE public.list_countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES public.country_lists(id) ON DELETE CASCADE,
  country_code CHAR(2) NOT NULL,
  country_name TEXT NOT NULL,
  notes TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, country_code)
);

COMMENT ON TABLE public.list_countries IS 'Countries belonging to a country list with optional notes';

-- Enable RLS on list_countries table
ALTER TABLE public.list_countries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view countries in their own lists
CREATE POLICY "Users can view countries in their lists"
  ON public.list_countries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.country_lists
      WHERE country_lists.id = list_countries.list_id
      AND country_lists.user_id = auth.uid()
    )
  );

-- Policy: Users can insert countries into their own lists
CREATE POLICY "Users can insert countries into their lists"
  ON public.list_countries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.country_lists
      WHERE country_lists.id = list_countries.list_id
      AND country_lists.user_id = auth.uid()
    )
  );

-- Policy: Users can update countries in their own lists
CREATE POLICY "Users can update countries in their lists"
  ON public.list_countries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.country_lists
      WHERE country_lists.id = list_countries.list_id
      AND country_lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.country_lists
      WHERE country_lists.id = list_countries.list_id
      AND country_lists.user_id = auth.uid()
    )
  );

-- Policy: Users can delete countries from their own lists
CREATE POLICY "Users can delete countries from their lists"
  ON public.list_countries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.country_lists
      WHERE country_lists.id = list_countries.list_id
      AND country_lists.user_id = auth.uid()
    )
  );

-- Trigger: Update updated_at when list country is modified
DROP TRIGGER IF EXISTS update_list_countries_updated_at ON public.list_countries;
CREATE TRIGGER update_list_countries_updated_at
  BEFORE UPDATE ON public.list_countries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_list_countries_list_id ON public.list_countries(list_id);
CREATE INDEX IF NOT EXISTS idx_list_countries_country_code ON public.list_countries(country_code);
