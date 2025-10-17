// Database types for TalentRate application
// Generated from Supabase schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      credit_ledger: {
        Row: {
          id: string
          user_id: string
          delta: number
          reason: string
          stripe_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          delta: number
          reason: string
          stripe_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          delta?: number
          reason?: string
          stripe_payment_id?: string | null
          created_at?: string
        }
      }
      job_runs: {
        Row: {
          id: string
          user_id: string
          role: string
          jd_text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          jd_text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          jd_text?: string
          created_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          job_run_id: string
          name: string | null
          email: string | null
          raw_text: string | null
          score: number
          reasons: Record<string, unknown> // JSONB
          bio: string
        }
        Insert: {
          id?: string
          job_run_id: string
          name?: string | null
          email?: string | null
          raw_text?: string | null
          score: number
          reasons: Record<string, unknown> // JSONB
          bio: string
        }
        Update: {
          id?: string
          job_run_id?: string
          name?: string | null
          email?: string | null
          raw_text?: string | null
          score?: number
          reasons?: Record<string, unknown> // JSONB
          bio?: string
        }
      }
    }
    Views: {
      v_credit_balance: {
        Row: {
          user_id: string
          balance: number
        }
      }
    }
    Functions: {
      get_user_credit_balance: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type CreditLedgerEntry = Database['public']['Tables']['credit_ledger']['Row']
export type JobRun = Database['public']['Tables']['job_runs']['Row']
export type Candidate = Database['public']['Tables']['candidates']['Row']
export type CreditBalance = Database['public']['Views']['v_credit_balance']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type CreditLedgerEntryInsert = Database['public']['Tables']['credit_ledger']['Insert']
export type JobRunInsert = Database['public']['Tables']['job_runs']['Insert']
export type CandidateInsert = Database['public']['Tables']['candidates']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type CreditLedgerEntryUpdate = Database['public']['Tables']['credit_ledger']['Update']
export type JobRunUpdate = Database['public']['Tables']['job_runs']['Update']
export type CandidateUpdate = Database['public']['Tables']['candidates']['Update']
