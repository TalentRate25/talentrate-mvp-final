-- Fix RLS policies for TalentRate
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own credit ledger" ON credit_ledger;
DROP POLICY IF EXISTS "Users can insert own credit ledger" ON credit_ledger;
DROP POLICY IF EXISTS "Users can view own job runs" ON job_runs;
DROP POLICY IF EXISTS "Users can insert own job runs" ON job_runs;
DROP POLICY IF EXISTS "Users can update own job runs" ON job_runs;
DROP POLICY IF EXISTS "Users can view candidates from own job runs" ON candidates;
DROP POLICY IF EXISTS "Users can insert candidates to own job runs" ON candidates;

-- Create proper RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own credit ledger" ON credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit ledger" ON credit_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own job runs" ON job_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job runs" ON job_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job runs" ON job_runs
  FOR UPDATE USING (auth.uid() = user_id);

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

-- Grant permissions
GRANT SELECT ON v_credit_balance TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
