# Database Setup Instructions

This document provides instructions for setting up the TalentRate database schema in Supabase.

## Prerequisites

- Supabase account and project
- Access to the Supabase dashboard

## Setup Steps

### 1. Create Database Schema

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` into the SQL Editor
4. Execute the SQL script

### 2. Verify Schema Creation

After running the SQL script, verify that the following tables and views were created:

- `profiles` - User profile information
- `credit_ledger` - Credit transaction history
- `job_runs` - Job analysis runs
- `candidates` - Candidate analysis results
- `v_credit_balance` - View for user credit balances

### 3. Test Database Connection

The application will automatically connect to the database using the environment variables in `.env.local`.

## Database Schema Overview

### Tables

#### `profiles`
- Stores user profile information
- Linked to Supabase Auth users
- Automatically created when a user signs up

#### `credit_ledger`
- Tracks all credit transactions (additions and deductions)
- Used for billing and credit management
- Supports Stripe payment integration

#### `job_runs`
- Stores job analysis requests
- Contains job description text and selected role
- Linked to user who initiated the analysis

#### `candidates`
- Stores individual candidate analysis results
- Contains scores, reasons, and bio information
- Linked to the job run that generated them

### Views

#### `v_credit_balance`
- Provides real-time credit balance for each user
- Calculated from credit_ledger transactions

### Functions

#### `get_user_credit_balance(user_uuid)`
- Returns the current credit balance for a specific user
- Used by the application to check available credits

## Security

The schema includes Row Level Security (RLS) policies that ensure:
- Users can only access their own data
- Proper authentication is required for all operations
- Data isolation between users

## Environment Variables

Make sure your `.env.local` file contains the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yzxpwwuoiouxfdlkpbjj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

After setup, you can test the database connection by running:

```bash
npm run dev
```

The application should start without database connection errors.
