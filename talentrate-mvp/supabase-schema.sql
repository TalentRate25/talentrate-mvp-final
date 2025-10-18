-- TalentRate Database Schema
-- This file contains the complete database schema for the TalentRate application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create credit_ledger table
CREATE TABLE credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  stripe_payment_id text,
  created_at timestamptz DEFAULT now()
);

-- Create job_runs table
CREATE TABLE job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  jd_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create candidates table
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_run_id uuid NOT NULL REFERENCES job_runs(id) ON DELETE CASCADE,
  name text,
  email text,
  raw_text text,
  score numeric NOT NULL,
  reasons jsonb NOT NULL,
  bio text NOT NULL
);

-- Create view for credit balance
CREATE VIEW v_credit_balance AS
SELECT user_id, coalesce(sum(delta),0)::int AS balance
FROM credit_ledger 
GROUP BY user_id;

-- Create indexes for better performance
CREATE INDEX idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX idx_credit_ledger_created_at ON credit_ledger(created_at);
CREATE INDEX idx_job_runs_user_id ON job_runs(user_id);
CREATE INDEX idx_job_runs_created_at ON job_runs(created_at);
CREATE INDEX idx_candidates_job_run_id ON candidates(job_run_id);
CREATE INDEX idx_candidates_score ON candidates(score);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Credit ledger policies
CREATE POLICY "Users can view own credit ledger" ON credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit ledger" ON credit_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job runs policies
CREATE POLICY "Users can view own job runs" ON job_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job runs" ON job_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job runs" ON job_runs
  FOR UPDATE USING (auth.uid() = user_id);

-- Candidates policies
CREATE POLICY "Users can view candidates from own job runs" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_runs 
      WHERE job_runs.id = candidates.job_run_id 
      AND job_runs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert candidates to own job runs" ON candidates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_runs 
      WHERE job_runs.id = candidates.job_run_id 
      AND job_runs.user_id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(user_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COALESCE(balance, 0)
    FROM v_credit_balance
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on the view (views inherit RLS from underlying tables)
-- But we need to grant access to the view specifically
GRANT SELECT ON v_credit_balance TO anon, authenticated;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
