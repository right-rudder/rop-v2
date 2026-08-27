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
          latitude: number | null;
          longitude: number | null;
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
          latitude?: number | null;
          longitude?: number | null;
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
          latitude?: number | null;
          longitude?: number | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: { user_id: string; school_id: string; created_at: string };
        Insert: { user_id: string; school_id: string; created_at?: string };
        Update: { user_id?: string; school_id?: string; created_at?: string };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          school_id: string | null;
          name: string;
          email: string;
          phone: string;
          program_slug: string | null;
          message: string;
          source_path: string;
          ip_hash: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          name: string;
          email: string;
          phone?: string;
          program_slug?: string | null;
          message?: string;
          source_path?: string;
          ip_hash: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          name?: string;
          email?: string;
          phone?: string;
          program_slug?: string | null;
          message?: string;
          source_path?: string;
          ip_hash?: string;
          status?: string;
          created_at?: string;
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
          latitude: number | null;
          longitude: number | null;
          logo_path: string | null;
          school_types: string[];
          va_approved: boolean | null;
          visa_types: string[];
          dormitory: boolean | null;
          dpe_on_site: boolean | null;
          in_house_maintenance: boolean | null;
          hours: string | null;
          address: string | null;
          training_tags: string[];
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
          latitude?: number | null;
          longitude?: number | null;
          logo_path?: string | null;
          school_types?: string[];
          va_approved?: boolean | null;
          visa_types?: string[];
          dormitory?: boolean | null;
          dpe_on_site?: boolean | null;
          in_house_maintenance?: boolean | null;
          hours?: string | null;
          address?: string | null;
          training_tags?: string[];
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
          latitude?: number | null;
          longitude?: number | null;
          logo_path?: string | null;
          school_types?: string[];
          va_approved?: boolean | null;
          visa_types?: string[];
          dormitory?: boolean | null;
          dpe_on_site?: boolean | null;
          in_house_maintenance?: boolean | null;
          hours?: string | null;
          address?: string | null;
          training_tags?: string[];
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
      school_claims: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          status: string;
          role_title: string;
          message: string;
          work_email: string;
          decided_by: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          status?: string;
          role_title: string;
          message?: string;
          work_email: string;
          decided_by?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        // Only status / decided_by / decided_at are granted to the Data API
        // roles; the rest are here because the generator emits them.
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string;
          status?: string;
          role_title?: string;
          message?: string;
          work_email?: string;
          decided_by?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          school_id: string | null;
          title: string;
          body: string;
          href: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          school_id?: string | null;
          title: string;
          body?: string;
          href?: string;
          read_at?: string | null;
          created_at?: string;
        };
        // Recipients only ever hold the read_at column grant.
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          school_id?: string | null;
          title?: string;
          body?: string;
          href?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_lead: {
        Args: {
          p_school_id: string;
          p_name: string;
          p_email: string;
          p_phone: string;
          p_program_slug: string;
          p_message: string;
          p_source_path: string;
          p_ip_hash: string;
        };
        Returns: string;
      };
      /** service_role only — see the grant in supabase/schema.sql. */
      user_id_by_email: {
        Args: { p_email: string };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
