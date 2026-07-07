/**
 * Database row types matching supabase/schema.sql.
 *
 * Hand-written for now. Once the Supabase project is linked you can
 * regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          role: string;
          bio: string | null;
          pilot_certificates: Json;
          joined_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          role?: string;
          bio?: string | null;
          pilot_certificates?: Json;
          joined_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          role?: string;
          bio?: string | null;
          pilot_certificates?: Json;
          joined_at?: string;
        };
        Relationships: [];
      };
      states: {
        Row: {
          id: string;
          name: string;
          slug: string;
          abbreviation: string;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          abbreviation: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          abbreviation?: string;
        };
        Relationships: [];
      };
      cities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          state_slug: string;
          state_abbreviation: string;
          nearby_city_slugs: Json;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          state_slug: string;
          state_abbreviation: string;
          nearby_city_slugs?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          state_slug?: string;
          state_abbreviation?: string;
          nearby_city_slugs?: Json;
        };
        Relationships: [];
      };
      airports: {
        Row: {
          id: string;
          name: string;
          icao: string;
          iata: string | null;
          faa_lid: string | null;
          city_slug: string;
          state_slug: string;
          description: string | null;
        };
        Insert: {
          id: string;
          name: string;
          icao: string;
          iata?: string | null;
          faa_lid?: string | null;
          city_slug: string;
          state_slug: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          icao?: string;
          iata?: string | null;
          faa_lid?: string | null;
          city_slug?: string;
          state_slug?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_name: string;
          description: string;
          faa_part: string | null;
          minimum_hours: number | null;
          certificate: string | null;
          prerequisites: Json;
          typical_duration: string | null;
          sort_order: number;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          short_name: string;
          description?: string;
          faa_part?: string | null;
          minimum_hours?: number | null;
          certificate?: string | null;
          prerequisites?: Json;
          typical_duration?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          short_name?: string;
          description?: string;
          faa_part?: string | null;
          minimum_hours?: number | null;
          certificate?: string | null;
          prerequisites?: Json;
          typical_duration?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      trainer_aircraft: {
        Row: {
          id: string;
          slug: string;
          make: string;
          model: string;
          display_name: string;
          category: string;
          description: string;
          common_use: Json;
          engine_count: number;
          typical_cruise: string | null;
          sort_order: number;
        };
        Insert: {
          id: string;
          slug: string;
          make: string;
          model: string;
          display_name: string;
          category: string;
          description?: string;
          common_use?: Json;
          engine_count?: number;
          typical_cruise?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          slug?: string;
          make?: string;
          model?: string;
          display_name?: string;
          category?: string;
          description?: string;
          common_use?: Json;
          engine_count?: number;
          typical_cruise?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      flight_schools: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          primary_airport_code: string;
          city_slug: string;
          state_slug: string;
          organization_id: string | null;
          rating: number;
          review_count: number;
          website: string;
          phone: string;
          featured: boolean;
          faa_part: string | null;
          contacts: Json;
          estimated_planes: string | null;
          estimated_instructors: string | null;
          managed_by: string | null;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          description?: string;
          primary_airport_code: string;
          city_slug: string;
          state_slug: string;
          organization_id?: string | null;
          rating?: number;
          review_count?: number;
          website?: string;
          phone?: string;
          featured?: boolean;
          faa_part?: string | null;
          contacts?: Json;
          estimated_planes?: string | null;
          estimated_instructors?: string | null;
          managed_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          primary_airport_code?: string;
          city_slug?: string;
          state_slug?: string;
          organization_id?: string | null;
          rating?: number;
          review_count?: number;
          website?: string;
          phone?: string;
          featured?: boolean;
          faa_part?: string | null;
          contacts?: Json;
          estimated_planes?: string | null;
          estimated_instructors?: string | null;
          managed_by?: string | null;
        };
        Relationships: [];
      };
      school_programs: {
        Row: {
          school_id: string;
          program_slug: string;
        };
        Insert: {
          school_id: string;
          program_slug: string;
        };
        Update: {
          school_id?: string;
          program_slug?: string;
        };
        Relationships: [];
      };
      school_aircraft: {
        Row: {
          school_id: string;
          aircraft_slug: string;
        };
        Insert: {
          school_id: string;
          aircraft_slug: string;
        };
        Update: {
          school_id?: string;
          aircraft_slug?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          overall: number;
          customer_service: number;
          instructors: number;
          aircraft: number;
          availability: number;
          facilities: number;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          overall: number;
          customer_service: number;
          instructors: number;
          aircraft: number;
          availability: number;
          facilities: number;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string;
          overall?: number;
          customer_service?: number;
          instructors?: number;
          aircraft?: number;
          availability?: number;
          facilities?: number;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      school_submissions: {
        Row: {
          id: string;
          submitted_by: string;
          status: string;
          name: string;
          description: string;
          website: string;
          phone: string;
          airport_code: string;
          city: string;
          state: string;
          faa_part: string | null;
          programs: Json;
          estimated_planes: string | null;
          estimated_instructors: string | null;
          contacts: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          submitted_by: string;
          status?: string;
          name: string;
          description: string;
          website?: string;
          phone?: string;
          airport_code: string;
          city: string;
          state: string;
          faa_part?: string | null;
          programs?: Json;
          estimated_planes?: string | null;
          estimated_instructors?: string | null;
          contacts?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          submitted_by?: string;
          status?: string;
          name?: string;
          description?: string;
          website?: string;
          phone?: string;
          airport_code?: string;
          city?: string;
          state?: string;
          faa_part?: string | null;
          programs?: Json;
          estimated_planes?: string | null;
          estimated_instructors?: string | null;
          contacts?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
