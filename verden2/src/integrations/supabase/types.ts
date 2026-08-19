export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string
          emoji: string
          id: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          emoji?: string
          id?: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      amenity_reports: {
        Row: {
          amenity_kind: string
          amenity_ref: string
          created_at: string
          created_by: string
          id: string
          lat: number
          lng: number
          status: string
        }
        Insert: {
          amenity_kind: string
          amenity_ref: string
          created_at?: string
          created_by: string
          id?: string
          lat: number
          lng: number
          status: string
        }
        Update: {
          amenity_kind?: string
          amenity_ref?: string
          created_at?: string
          created_by?: string
          id?: string
          lat?: number
          lng?: number
          status?: string
        }
        Relationships: []
      }
      convoy_members: {
        Row: {
          activity_status: string
          convoy_id: string
          created_at: string
          id: string
          invited_email: string
          joined_at: string | null
          last_heading: number | null
          last_lat: number | null
          last_lng: number | null
          last_ping_at: string | null
          last_speed_kmh: number | null
          role: string
          sharing_enabled: boolean
          status: string
          updated_at: string
          user_id: string | null
          vehicle_model_key: string | null
        }
        Insert: {
          activity_status?: string
          convoy_id: string
          created_at?: string
          id?: string
          invited_email: string
          joined_at?: string | null
          last_heading?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_ping_at?: string | null
          last_speed_kmh?: number | null
          role?: string
          sharing_enabled?: boolean
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_model_key?: string | null
        }
        Update: {
          activity_status?: string
          convoy_id?: string
          created_at?: string
          id?: string
          invited_email?: string
          joined_at?: string | null
          last_heading?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_ping_at?: string | null
          last_speed_kmh?: number | null
          role?: string
          sharing_enabled?: boolean
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_model_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convoy_members_convoy_id_fkey"
            columns: ["convoy_id"]
            isOneToOne: false
            referencedRelation: "convoys"
            referencedColumns: ["id"]
          },
        ]
      }
      convoys: {
        Row: {
          cover_emoji: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          started_at: string | null
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          cover_emoji?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id: string
          started_at?: string | null
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          cover_emoji?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          started_at?: string | null
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "convoys_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "verden_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      ecomoov_groups: {
        Row: {
          created_at: string
          description: string | null
          goal_co2_kg: number
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal_co2_kg?: number
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goal_co2_kg?: number
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      garage_vehicles: {
        Row: {
          brand: string | null
          category: string
          color: string
          cosmetics: Json
          created_at: string
          id: string
          is_default: boolean
          model: string | null
          model_key: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string
          color?: string
          cosmetics?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          model?: string | null
          model_key: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string
          color?: string
          cosmetics?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          model?: string | null
          model_key?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          contributed_co2_kg: number
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          contributed_co2_kg?: number
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          contributed_co2_kg?: number
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ecomoov_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      map_alerts: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          kind: string
          lat: number
          lng: number
          note: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          kind: string
          lat: number
          lng: number
          note?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          kind?: string
          lat?: number
          lng?: number
          note?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "map_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "verden_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_profiles: {
        Row: {
          code: string
          created_at: string
          id: string
          membership: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          membership: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          membership?: string
          user_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          code: string
          id: string
          membership: string
        }
        Insert: {
          code: string
          id?: string
          membership: string
        }
        Update: {
          code?: string
          id?: string
          membership?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      offline_regions: {
        Row: {
          created_at: string
          id: string
          max_lat: number
          max_lng: number
          max_zoom: number
          min_lat: number
          min_lng: number
          min_zoom: number
          name: string
          progress: number
          size_bytes: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_lat: number
          max_lng: number
          max_zoom?: number
          min_lat: number
          min_lng: number
          min_zoom?: number
          name: string
          progress?: number
          size_bytes?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_lat?: number
          max_lng?: number
          max_zoom?: number
          min_lat?: number
          min_lng?: number
          min_zoom?: number
          name?: string
          progress?: number
          size_bytes?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      place_reports: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          lat: number
          lng: number
          place_name: string
          place_ref: string | null
          tag: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          lat: number
          lng: number
          place_name: string
          place_ref?: string | null
          tag: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          lat?: number
          lng?: number
          place_name?: string
          place_ref?: string | null
          tag?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          car_fuel_type: string | null
          car_mileage: number | null
          car_model: string | null
          car_year: number | null
          created_at: string
          credits: number
          full_name: string | null
          id: string
          selected_token: string | null
          total_co2_saved: number
          unlocked_tokens: string[] | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          car_fuel_type?: string | null
          car_mileage?: number | null
          car_model?: string | null
          car_year?: number | null
          created_at?: string
          credits?: number
          full_name?: string | null
          id: string
          selected_token?: string | null
          total_co2_saved?: number
          unlocked_tokens?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          car_fuel_type?: string | null
          car_mileage?: number | null
          car_model?: string | null
          car_year?: number | null
          created_at?: string
          credits?: number
          full_name?: string | null
          id?: string
          selected_token?: string | null
          total_co2_saved?: number
          unlocked_tokens?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_events: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          participants: Json
          place_name: string | null
          position: number
          starts_at: string | null
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          participants?: Json
          place_name?: string | null
          position?: number
          starts_at?: string | null
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          participants?: Json
          place_name?: string | null
          position?: number
          starts_at?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "verden_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          trip_id: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          trip_id: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          trip_id?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "trip_invites_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "verden_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          activity_status: string
          convoy_enabled: boolean
          id: string
          joined_at: string
          last_heading: number | null
          last_lat: number | null
          last_lng: number | null
          last_ping_at: string | null
          last_speed_kmh: number | null
          role: string
          trip_id: string
          updated_at: string
          user_id: string
          vehicle_model_key: string | null
        }
        Insert: {
          activity_status?: string
          convoy_enabled?: boolean
          id?: string
          joined_at?: string
          last_heading?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_ping_at?: string | null
          last_speed_kmh?: number | null
          role?: string
          trip_id: string
          updated_at?: string
          user_id: string
          vehicle_model_key?: string | null
        }
        Update: {
          activity_status?: string
          convoy_enabled?: boolean
          id?: string
          joined_at?: string
          last_heading?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_ping_at?: string | null
          last_speed_kmh?: number | null
          role?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
          vehicle_model_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "verden_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string
          emoji: string
          id: string
          lat: number
          lng: number
          photo_url: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by: string
          emoji?: string
          id?: string
          lat: number
          lng: number
          photo_url?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          emoji?: string
          id?: string
          lat?: number
          lng?: number
          photo_url?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "verden_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_places: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          lat: number
          lng: number
          metadata: Json
          model_key: string | null
          name: string
          position: number
          trip_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind?: string
          lat: number
          lng: number
          metadata?: Json
          model_key?: string | null
          name: string
          position?: number
          trip_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          lat?: number
          lng?: number
          metadata?: Json
          model_key?: string | null
          name?: string
          position?: number
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_places_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "verden_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          co2_kg: number
          created_at: string
          credits_earned: number
          dest_lat: number
          dest_lng: number
          destination_label: string
          distance_km: number
          duration_min: number
          greenery_score: number | null
          id: string
          origin_label: string
          origin_lat: number
          origin_lng: number
          polyline: string | null
          route_type: string
          transport_mode: string
          travel_profile: string
          user_id: string
          verden_trip_id: string | null
        }
        Insert: {
          co2_kg: number
          created_at?: string
          credits_earned?: number
          dest_lat: number
          dest_lng: number
          destination_label: string
          distance_km: number
          duration_min: number
          greenery_score?: number | null
          id?: string
          origin_label: string
          origin_lat: number
          origin_lng: number
          polyline?: string | null
          route_type?: string
          transport_mode?: string
          travel_profile?: string
          user_id: string
          verden_trip_id?: string | null
        }
        Update: {
          co2_kg?: number
          created_at?: string
          credits_earned?: number
          dest_lat?: number
          dest_lng?: number
          destination_label?: string
          distance_km?: number
          duration_min?: number
          greenery_score?: number | null
          id?: string
          origin_label?: string
          origin_lat?: number
          origin_lng?: number
          polyline?: string | null
          route_type?: string
          transport_mode?: string
          travel_profile?: string
          user_id?: string
          verden_trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_verden_trip_id_fkey"
            columns: ["verden_trip_id"]
            isOneToOne: false
            referencedRelation: "verden_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          awarded_at: string
          code: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          code: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          code?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          accessibility: Json
          appearance: Json
          created_at: string
          experience_mode: string
          experimental: Json
          map_mood: string
          navigation: Json
          notifications: Json
          privacy: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility?: Json
          appearance?: Json
          created_at?: string
          experience_mode?: string
          experimental?: Json
          map_mood?: string
          navigation?: Json
          notifications?: Json
          privacy?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility?: Json
          appearance?: Json
          created_at?: string
          experience_mode?: string
          experimental?: Json
          map_mood?: string
          navigation?: Json
          notifications?: Json
          privacy?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verden_trips: {
        Row: {
          convoy_active: boolean
          convoy_started_at: string | null
          cover_emoji: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          name: string
          owner_id: string
          starts_at: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          convoy_active?: boolean
          convoy_started_at?: string | null
          cover_emoji?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          name: string
          owner_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          convoy_active?: boolean
          convoy_started_at?: string | null
          cover_emoji?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      verden3_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          referred_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          referred_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          referred_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_convoy_owner: {
        Args: { _convoy_id: string; _user_id: string }
        Returns: boolean
      }
      is_convoy_participant: {
        Args: { _convoy_id: string; _user_id: string }
        Returns: boolean
      }
      is_trip_member: {
        Args: { _trip_id: string; _user_id: string }
        Returns: boolean
      }
      is_trip_public: { Args: { _trip_id: string }; Returns: boolean }
      purge_expired_map_data: { Args: never; Returns: undefined }
      redeem_trip_invite: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
