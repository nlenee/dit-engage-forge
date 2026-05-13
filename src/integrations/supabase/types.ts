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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string
          role: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type: string
          role: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_invitations: {
        Row: {
          accepted_at: string | null
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          target_id: string | null
          target_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          target_id?: string | null
          target_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          target_id?: string | null
          target_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      birthday_notifications: {
        Row: {
          created_at: string
          id: string
          member_id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthday_notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          fiscal_year: number
          id: string
          name: string
          notes: string | null
          spent_amount: number
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          fiscal_year: number
          id?: string
          name: string
          notes?: string | null
          spent_amount?: number
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          fiscal_year?: number
          id?: string
          name?: string
          notes?: string | null
          spent_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      bulk_email_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          letter_id: string | null
          message: string
          sent_count: number
          started_at: string | null
          status: string
          subject: string
          total_recipients: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          letter_id?: string | null
          message: string
          sent_count?: number
          started_at?: string | null
          status?: string
          subject: string
          total_recipients?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          letter_id?: string | null
          message?: string
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string
          total_recipients?: number
        }
        Relationships: [
          {
            foreignKeyName: "bulk_email_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bulk_email_jobs_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_email_recipients: {
        Row: {
          error_message: string | null
          id: string
          job_id: string
          recipient_email: string
          recipient_name: string
          sent_at: string | null
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          job_id: string
          recipient_email: string
          recipient_name: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          job_id?: string
          recipient_email?: string
          recipient_name?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_email_recipients_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bulk_email_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      community_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          resolution_notes: string | null
          resolved_by: string | null
          status: string
          subject: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          resolution_notes?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          resolution_notes?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      digital_seals: {
        Row: {
          approval_token: string | null
          approved_at: string | null
          approved_by_email: string | null
          id: string
          letter_id: string
          purpose: string
          rejected_at: string | null
          rejection_reason: string | null
          requested_at: string
          requested_by: string | null
          seal_image_url: string | null
          status: string
          verification_emails_sent: boolean | null
        }
        Insert: {
          approval_token?: string | null
          approved_at?: string | null
          approved_by_email?: string | null
          id?: string
          letter_id: string
          purpose: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string | null
          seal_image_url?: string | null
          status?: string
          verification_emails_sent?: boolean | null
        }
        Update: {
          approval_token?: string | null
          approved_at?: string | null
          approved_by_email?: string | null
          id?: string
          letter_id?: string
          purpose?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string | null
          seal_image_url?: string | null
          status?: string
          verification_emails_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_seals_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_seals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          failed_count: number | null
          id: string
          name: string
          recipients_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          template_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          name: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          template_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          name?: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          template_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          delivery_status: string | null
          id: string
          letter_id: string | null
          opened_at: string | null
          recipient_email: string
          resend_email_id: string | null
          sent_at: string
          sent_by: string | null
          status: string
          subject: string
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          delivery_status?: string | null
          id?: string
          letter_id?: string | null
          opened_at?: string | null
          recipient_email: string
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject: string
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          delivery_status?: string | null
          id?: string
          letter_id?: string | null
          opened_at?: string | null
          recipient_email?: string
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          subject: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      engagement_logs: {
        Row: {
          action_type: string
          created_at: string
          created_by: string
          id: string
          member_user_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by: string
          id?: string
          member_user_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string
          id?: string
          member_user_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_end_date: string | null
          id: string
          location: string | null
          max_attendees: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          event_end_date?: string | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_end_date?: string | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string
          description: string
          document_url: string | null
          faction: string | null
          id: string
          reference_number: string | null
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by: string
          description: string
          document_url?: string | null
          faction?: string | null
          id?: string
          reference_number?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string
          document_url?: string | null
          faction?: string | null
          id?: string
          reference_number?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      fundraising_campaigns: {
        Row: {
          contributors_count: number
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          raised_amount: number
          start_date: string
          status: string
          target_amount: number
          updated_at: string
        }
        Insert: {
          contributors_count?: number
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          raised_amount?: number
          start_date: string
          status?: string
          target_amount: number
          updated_at?: string
        }
        Update: {
          contributors_count?: number
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          raised_amount?: number
          start_date?: string
          status?: string
          target_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      letter_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      letter_versions: {
        Row: {
          change_summary: string | null
          country: string
          created_at: string
          created_by: string | null
          date_of_assignment: string
          id: string
          letter_content: string
          letter_id: string
          office: string
          recipient_email: string
          recipient_name: string
          signatories: Json
          state: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          date_of_assignment: string
          id?: string
          letter_content: string
          letter_id: string
          office: string
          recipient_email: string
          recipient_name: string
          signatories?: Json
          state?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          date_of_assignment?: string
          id?: string
          letter_content?: string
          letter_id?: string
          office?: string
          recipient_email?: string
          recipient_name?: string
          signatories?: Json
          state?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "letter_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "letter_versions_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          country: string
          created_at: string
          created_by: string | null
          date_of_assignment: string
          id: string
          letter_content: string
          office: string
          recipient_email: string
          recipient_name: string
          signatories: Json
          state: string | null
          status: Database["public"]["Enums"]["letter_status"] | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          created_by?: string | null
          date_of_assignment: string
          id?: string
          letter_content: string
          office: string
          recipient_email: string
          recipient_name: string
          signatories?: Json
          state?: string | null
          status?: Database["public"]["Enums"]["letter_status"] | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          created_by?: string | null
          date_of_assignment?: string
          id?: string
          letter_content?: string
          office?: string
          recipient_email?: string
          recipient_name?: string
          signatories?: Json
          state?: string | null
          status?: Database["public"]["Enums"]["letter_status"] | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "letters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "letter_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      member_invitations: {
        Row: {
          accepted_at: string | null
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      members: {
        Row: {
          bio: string | null
          birthday: string | null
          country: string | null
          created_at: string
          email: string
          email_verification_code: string | null
          email_verified: boolean | null
          faction: string | null
          full_name: string
          id: string
          invitation_sent_at: string | null
          invitation_token: string | null
          joined_dit_date: string | null
          locked_by_admin: boolean | null
          phone: string | null
          previous_roles: string[] | null
          registered_at: string | null
          role_in_dit: string | null
          state: string | null
          testimony: string | null
          updated_at: string
          user_id: string | null
          verification_code_expires_at: string | null
        }
        Insert: {
          bio?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          email: string
          email_verification_code?: string | null
          email_verified?: boolean | null
          faction?: string | null
          full_name: string
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
          joined_dit_date?: string | null
          locked_by_admin?: boolean | null
          phone?: string | null
          previous_roles?: string[] | null
          registered_at?: string | null
          role_in_dit?: string | null
          state?: string | null
          testimony?: string | null
          updated_at?: string
          user_id?: string | null
          verification_code_expires_at?: string | null
        }
        Update: {
          bio?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          email?: string
          email_verification_code?: string | null
          email_verified?: boolean | null
          faction?: string | null
          full_name?: string
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
          joined_dit_date?: string | null
          locked_by_admin?: boolean | null
          phone?: string | null
          previous_roles?: string[] | null
          registered_at?: string | null
          role_in_dit?: string | null
          state?: string | null
          testimony?: string | null
          updated_at?: string
          user_id?: string | null
          verification_code_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_background: string | null
          avatar_url: string | null
          bio: string | null
          course: string | null
          created_at: string
          date_joined_approx: boolean | null
          date_joined_day: number | null
          date_joined_month: number | null
          date_joined_year: number | null
          date_of_birth: string | null
          email: string | null
          employer_name: string | null
          employment_status: string | null
          faction: string | null
          full_name: string | null
          graduation_year: number | null
          id: string
          is_student: boolean | null
          level: string | null
          origin_city: string | null
          origin_country: string | null
          origin_state: string | null
          phone: string | null
          profile_completed: boolean
          residence_city: string | null
          residence_country: string | null
          residence_state: string | null
          school: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_background?: string | null
          avatar_url?: string | null
          bio?: string | null
          course?: string | null
          created_at?: string
          date_joined_approx?: boolean | null
          date_joined_day?: number | null
          date_joined_month?: number | null
          date_joined_year?: number | null
          date_of_birth?: string | null
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          faction?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          is_student?: boolean | null
          level?: string | null
          origin_city?: string | null
          origin_country?: string | null
          origin_state?: string | null
          phone?: string | null
          profile_completed?: boolean
          residence_city?: string | null
          residence_country?: string | null
          residence_state?: string | null
          school?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_background?: string | null
          avatar_url?: string | null
          bio?: string | null
          course?: string | null
          created_at?: string
          date_joined_approx?: boolean | null
          date_joined_day?: number | null
          date_joined_month?: number | null
          date_joined_year?: number | null
          date_of_birth?: string | null
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          faction?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          is_student?: boolean | null
          level?: string | null
          origin_city?: string | null
          origin_country?: string | null
          origin_state?: string | null
          phone?: string | null
          profile_completed?: boolean
          residence_city?: string | null
          residence_country?: string | null
          residence_state?: string | null
          school?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      saved_signatures: {
        Row: {
          created_at: string
          id: string
          name: string
          signature_url: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          signature_url: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          signature_url?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          letter_id: string | null
          message: string
          pdf_base64: string | null
          recipient_email: string
          recipient_name: string
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string
          timezone: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          letter_id?: string | null
          message: string
          pdf_base64?: string | null
          recipient_email: string
          recipient_name: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          subject: string
          timezone?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          letter_id?: string | null
          message?: string
          pdf_base64?: string | null
          recipient_email?: string
          recipient_name?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scheduled_emails_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      admin_users_roles: {
        Row: {
          email: string | null
          roles: string[] | null
          signup_date: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: { role_name: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
      has_role_text: { Args: { role_name: string }; Returns: boolean }
      is_executive_secretary: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "executive_secretary"
        | "community_manager"
        | "chief_finance_officer"
        | "cfo"
      letter_status: "draft" | "downloaded" | "sent"
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
    Enums: {
      app_role: [
        "admin",
        "user",
        "super_admin",
        "executive_secretary",
        "community_manager",
        "chief_finance_officer",
        "cfo",
      ],
      letter_status: ["draft", "downloaded", "sent"],
    },
  },
} as const
