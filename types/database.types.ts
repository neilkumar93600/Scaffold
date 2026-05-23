// Auto-generated Supabase database types — regenerate with: pnpm db:generate
// This is a stub; run `supabase gen types typescript` after connecting to your project

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'solo' | 'team' | 'studio'
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'solo' | 'team' | 'studio'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'solo' | 'team' | 'studio'
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
