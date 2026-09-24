export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          country: string | null;
          city: string | null;
          timezone: string | null;
          preferred_language: string | null;
          prayer_calculation_method: string | null;
          asr_madhhab: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          country?: string | null;
          city?: string | null;
          timezone?: string | null;
          preferred_language?: string | null;
          prayer_calculation_method?: string | null;
          asr_madhhab?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      hadiths: {
        Row: {
          id: string;
          arabic_text: string;
          english_translation: string;
          bangla_translation: string | null;
          source: string;
          book: string;
          hadith_number: string;
          grade: string | null;
          topic: string | null;
          is_verified: boolean;
          created_at: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
