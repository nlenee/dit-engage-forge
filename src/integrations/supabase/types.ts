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
      achievements: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          threshold_xp: number | null
          title: string
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          threshold_xp?: number | null
          title: string
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          threshold_xp?: number | null
          title?: string
        }
        Relationships: []
      }
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
        Relationships: []
      }
      ai_placement_results: {
        Row: {
          application_id: string
          created_at: string
          faction_reasoning: Json | null
          faction_scores: Json
          flag_reason: string | null
          id: string
          model_version: string | null
          placement_flag: boolean
          primary_faction: string | null
          role_suggestions: Json | null
        }
        Insert: {
          application_id: string
          created_at?: string
          faction_reasoning?: Json | null
          faction_scores?: Json
          flag_reason?: string | null
          id?: string
          model_version?: string | null
          placement_flag?: boolean
          primary_faction?: string | null
          role_suggestions?: Json | null
        }
        Update: {
          application_id?: string
          created_at?: string
          faction_reasoning?: Json | null
          faction_scores?: Json
          flag_reason?: string | null
          id?: string
          model_version?: string | null
          placement_flag?: boolean
          primary_faction?: string | null
          role_suggestions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_placement_results_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
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
      application_documents: {
        Row: {
          application_id: string
          document_type: Database["public"]["Enums"]["app_document_type"]
          file_name: string | null
          id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          application_id: string
          document_type: Database["public"]["Enums"]["app_document_type"]
          file_name?: string | null
          id?: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          application_id?: string
          document_type?: Database["public"]["Enums"]["app_document_type"]
          file_name?: string | null
          id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_links: {
        Row: {
          application_count: number
          created_at: string
          created_by: string | null
          faction: string | null
          id: string
          is_active: boolean
          link_slug: string
          ref_campaign: string | null
          target_url: string | null
        }
        Insert: {
          application_count?: number
          created_at?: string
          created_by?: string | null
          faction?: string | null
          id?: string
          is_active?: boolean
          link_slug: string
          ref_campaign?: string | null
          target_url?: string | null
        }
        Update: {
          application_count?: number
          created_at?: string
          created_by?: string | null
          faction?: string | null
          id?: string
          is_active?: boolean
          link_slug?: string
          ref_campaign?: string | null
          target_url?: string | null
        }
        Relationships: []
      }
      application_responses: {
        Row: {
          application_id: string
          created_at: string
          id: string
          question_key: string
          question_text: string | null
          response_value: Json | null
          section: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          question_key: string
          question_text?: string | null
          response_value?: Json | null
          section: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          question_key?: string
          question_text?: string | null
          response_value?: Json | null
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_responses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_reviews: {
        Row: {
          action: Database["public"]["Enums"]["review_action"]
          application_id: string
          comment: string | null
          created_at: string
          id: string
          reviewer_id: string
          reviewer_role: string | null
          target_faction: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["review_action"]
          application_id: string
          comment?: string | null
          created_at?: string
          id?: string
          reviewer_id: string
          reviewer_role?: string | null
          target_faction?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["review_action"]
          application_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          reviewer_id?: string
          reviewer_role?: string | null
          target_faction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_log: {
        Row: {
          application_id: string
          changed_by: string | null
          changed_by_role: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          previous_status: string | null
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          changed_by_role?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          previous_status?: string | null
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          changed_by_role?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_status_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          about_yourself: string | null
          ai_about_ai_score: number | null
          ai_about_human_score: number | null
          ai_role_suggestions: Json | null
          ai_suggested_faction: string | null
          ai_suggestion_accepted: boolean | null
          ai_why_ai_score: number | null
          ai_why_human_score: number | null
          applicant_email: string
          applicant_name: string
          applicant_user_id: string | null
          application_type: Database["public"]["Enums"]["application_type"]
          created_at: string
          final_faction: string | null
          id: string
          link_slug: string | null
          placement_flag: boolean
          reapply_after: string | null
          ref_campaign: string | null
          reference_number: string
          referred_by_user_id: string | null
          referred_faction: string | null
          selected_faction: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          why_join_dit: string | null
        }
        Insert: {
          about_yourself?: string | null
          ai_about_ai_score?: number | null
          ai_about_human_score?: number | null
          ai_role_suggestions?: Json | null
          ai_suggested_faction?: string | null
          ai_suggestion_accepted?: boolean | null
          ai_why_ai_score?: number | null
          ai_why_human_score?: number | null
          applicant_email: string
          applicant_name: string
          applicant_user_id?: string | null
          application_type?: Database["public"]["Enums"]["application_type"]
          created_at?: string
          final_faction?: string | null
          id?: string
          link_slug?: string | null
          placement_flag?: boolean
          reapply_after?: string | null
          ref_campaign?: string | null
          reference_number?: string
          referred_by_user_id?: string | null
          referred_faction?: string | null
          selected_faction?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          why_join_dit?: string | null
        }
        Update: {
          about_yourself?: string | null
          ai_about_ai_score?: number | null
          ai_about_human_score?: number | null
          ai_role_suggestions?: Json | null
          ai_suggested_faction?: string | null
          ai_suggestion_accepted?: boolean | null
          ai_why_ai_score?: number | null
          ai_why_human_score?: number | null
          applicant_email?: string
          applicant_name?: string
          applicant_user_id?: string | null
          application_type?: Database["public"]["Enums"]["application_type"]
          created_at?: string
          final_faction?: string | null
          id?: string
          link_slug?: string | null
          placement_flag?: boolean
          reapply_after?: string | null
          ref_campaign?: string | null
          reference_number?: string
          referred_by_user_id?: string | null
          referred_faction?: string | null
          selected_faction?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          why_join_dit?: string | null
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
        Relationships: []
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
      form_templates: {
        Row: {
          created_at: string
          created_by: string | null
          faction: string | null
          form_description: string | null
          form_name: string
          form_type: Database["public"]["Enums"]["form_type"]
          id: string
          is_active: boolean
          last_edited_by: string | null
          sections: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          faction?: string | null
          form_description?: string | null
          form_name: string
          form_type: Database["public"]["Enums"]["form_type"]
          id?: string
          is_active?: boolean
          last_edited_by?: string | null
          sections?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          faction?: string | null
          form_description?: string | null
          form_name?: string
          form_type?: Database["public"]["Enums"]["form_type"]
          id?: string
          is_active?: boolean
          last_edited_by?: string | null
          sections?: Json
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
      interviews: {
        Row: {
          applicant_notified: boolean | null
          application_id: string
          channel: Database["public"]["Enums"]["interview_channel"]
          channel_address: string | null
          channel_link: string | null
          created_at: string
          id: string
          interview_date: string
          interview_time: string | null
          interviewer_ids: string[] | null
          notes: string | null
          outcome: Database["public"]["Enums"]["interview_outcome"]
          scheduled_by: string | null
        }
        Insert: {
          applicant_notified?: boolean | null
          application_id: string
          channel: Database["public"]["Enums"]["interview_channel"]
          channel_address?: string | null
          channel_link?: string | null
          created_at?: string
          id?: string
          interview_date: string
          interview_time?: string | null
          interviewer_ids?: string[] | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["interview_outcome"]
          scheduled_by?: string | null
        }
        Update: {
          applicant_notified?: boolean | null
          application_id?: string
          channel?: Database["public"]["Enums"]["interview_channel"]
          channel_address?: string | null
          channel_link?: string | null
          created_at?: string
          id?: string
          interview_date?: string
          interview_time?: string | null
          interviewer_ids?: string[] | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["interview_outcome"]
          scheduled_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      notifications_log: {
        Row: {
          application_id: string | null
          body: string | null
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          recipient_email: string
          sent_at: string
          subject: string | null
        }
        Insert: {
          application_id?: string | null
          body?: string | null
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          recipient_email: string
          sent_at?: string
          subject?: string | null
        }
        Update: {
          application_id?: string | null
          body?: string | null
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          recipient_email?: string
          sent_at?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      office_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          office_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          office_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          office_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_assignments_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_permissions: {
        Row: {
          created_at: string
          id: string
          office_id: string
          permission_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          office_id: string
          permission_key: string
        }
        Update: {
          created_at?: string
          id?: string
          office_id?: string
          permission_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_permissions_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          faction: string | null
          id: string
          kpis: Json
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          faction?: string | null
          id?: string
          kpis?: Json
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          faction?: string | null
          id?: string
          kpis?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          email: string
          id: string
          notes: string | null
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          email: string
          id?: string
          notes?: string | null
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          notes?: string | null
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pending_google_signups: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_background: string | null
          avatar_url: string | null
          bio: string | null
          course: string | null
          created_at: string
          custom_role_title: string | null
          date_joined_approx: boolean | null
          date_joined_day: number | null
          date_joined_month: number | null
          date_joined_year: number | null
          date_of_birth: string | null
          edits_locked: boolean
          email: string | null
          employer_name: string | null
          employment_status: string | null
          faction: string | null
          favourite_quote: string | null
          full_name: string | null
          graduation_year: number | null
          headshot_url: string | null
          id: string
          is_new_to_dit: boolean
          is_student: boolean | null
          level: string | null
          member_level: number
          origin_city: string | null
          origin_country: string | null
          origin_state: string | null
          pending_role_assignment: boolean
          phone: string | null
          profile_completed: boolean
          public_image_url: string | null
          residence_city: string | null
          residence_country: string | null
          residence_state: string | null
          school: string | null
          status: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          academic_background?: string | null
          avatar_url?: string | null
          bio?: string | null
          course?: string | null
          created_at?: string
          custom_role_title?: string | null
          date_joined_approx?: boolean | null
          date_joined_day?: number | null
          date_joined_month?: number | null
          date_joined_year?: number | null
          date_of_birth?: string | null
          edits_locked?: boolean
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          faction?: string | null
          favourite_quote?: string | null
          full_name?: string | null
          graduation_year?: number | null
          headshot_url?: string | null
          id?: string
          is_new_to_dit?: boolean
          is_student?: boolean | null
          level?: string | null
          member_level?: number
          origin_city?: string | null
          origin_country?: string | null
          origin_state?: string | null
          pending_role_assignment?: boolean
          phone?: string | null
          profile_completed?: boolean
          public_image_url?: string | null
          residence_city?: string | null
          residence_country?: string | null
          residence_state?: string | null
          school?: string | null
          status?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          academic_background?: string | null
          avatar_url?: string | null
          bio?: string | null
          course?: string | null
          created_at?: string
          custom_role_title?: string | null
          date_joined_approx?: boolean | null
          date_joined_day?: number | null
          date_joined_month?: number | null
          date_joined_year?: number | null
          date_of_birth?: string | null
          edits_locked?: boolean
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          faction?: string | null
          favourite_quote?: string | null
          full_name?: string | null
          graduation_year?: number | null
          headshot_url?: string | null
          id?: string
          is_new_to_dit?: boolean
          is_student?: boolean | null
          level?: string | null
          member_level?: number
          origin_city?: string | null
          origin_country?: string | null
          origin_state?: string | null
          pending_role_assignment?: boolean
          phone?: string | null
          profile_completed?: boolean
          public_image_url?: string | null
          residence_city?: string | null
          residence_country?: string | null
          residence_state?: string | null
          school?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      question_library: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_faction: string | null
          id: string
          is_global: boolean
          options: Json | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          scale_labels: Json | null
          scale_max: number | null
          scale_min: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_faction?: string | null
          id?: string
          is_global?: boolean
          options?: Json | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          scale_labels?: Json | null
          scale_max?: number | null
          scale_min?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_faction?: string | null
          id?: string
          is_global?: boolean
          options?: Json | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          scale_labels?: Json | null
          scale_max?: number | null
          scale_min?: number | null
        }
        Relationships: []
      }
      reapplication_locks: {
        Row: {
          applicant_email: string
          id: string
          lock_duration_days: number
          locked_at: string
          reason: string | null
          set_by: string | null
          unlock_at: string
        }
        Insert: {
          applicant_email: string
          id?: string
          lock_duration_days?: number
          locked_at?: string
          reason?: string | null
          set_by?: string | null
          unlock_at: string
        }
        Update: {
          applicant_email?: string
          id?: string
          lock_duration_days?: number
          locked_at?: string
          reason?: string | null
          set_by?: string | null
          unlock_at?: string
        }
        Relationships: []
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
            foreignKeyName: "scheduled_emails_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string
          evidence_url: string | null
          id: string
          notes: string | null
          points_awarded: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          evidence_url?: string | null
          id?: string
          notes?: string | null
          points_awarded?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          evidence_url?: string | null
          id?: string
          notes?: string | null
          points_awarded?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          active: boolean
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          points: number
          repeatable: boolean
          title: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          repeatable?: boolean
          title: string
        }
        Update: {
          active?: boolean
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          repeatable?: boolean
          title?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          faction: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          faction?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          faction?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      application_email_status: {
        Args: { _email: string }
        Returns: {
          has_active_member: boolean
          has_pending: boolean
        }[]
      }
      gen_application_reference: { Args: never; Returns: string }
      get_faction_birthdays: {
        Args: { _faction: string }
        Returns: {
          date_of_birth: string
          faction: string
          full_name: string
          headshot_url: string
          user_id: string
        }[]
      }
      get_leaderboard: {
        Args: { _faction?: string; _limit?: number }
        Returns: {
          faction: string
          full_name: string
          headshot_url: string
          member_level: number
          user_id: string
          xp: number
        }[]
      }
      get_member_directory: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          custom_role_title: string
          date_joined_year: number
          date_of_birth: string
          email: string
          faction: string
          full_name: string
          headshot_url: string
          id: string
          origin_country: string
          origin_state: string
          phone: string
          primary_role: string
          status: string
          user_id: string
        }[]
      }
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          bio: string
          created_at: string
          date_joined_year: number
          faction: string
          favourite_quote: string
          full_name: string
          headshot_url: string
          member_level: number
          public_image_url: string
          user_id: string
          xp: number
        }[]
      }
      has_any_global_role: { Args: { _user_id: string }; Returns: boolean }
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
      is_org_leader: { Args: { _user_id: string }; Returns: boolean }
      is_registered_member: { Args: { _email: string }; Returns: boolean }
      is_reviewer: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      submit_public_application: {
        Args: { _payload: Json }
        Returns: {
          id: string
          reference_number: string
        }[]
      }
      user_faction: { Args: { _user_id: string }; Returns: string }
      user_permissions: { Args: { _user_id: string }; Returns: string[] }
      validate_invitation_token: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          status: string
        }[]
      }
    }
    Enums: {
      app_document_type: "profile_photo" | "cv" | "portfolio" | "other"
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "executive_secretary"
        | "community_manager"
        | "chief_finance_officer"
        | "cfo"
        | "chief_executive_director"
        | "executive_director"
        | "executive_assistant"
      application_status:
        | "submitted"
        | "under_review"
        | "interview_scheduled"
        | "approved"
        | "rejected"
        | "reassigned"
        | "withdrawn"
        | "reapply_pending"
      application_type:
        | "membership"
        | "volunteer"
        | "program"
        | "boe_appointment"
      delivery_status: "sent" | "delivered" | "failed"
      form_type: "membership" | "volunteer" | "program" | "custom"
      interview_channel: "video_call" | "voice_call" | "in_person"
      interview_outcome: "pending" | "passed" | "failed" | "deferred"
      letter_status: "draft" | "downloaded" | "sent"
      notification_type:
        | "acknowledgement"
        | "status_update"
        | "interview_invite"
        | "decision"
        | "reapply_unlock"
      question_type:
        | "text"
        | "textarea"
        | "radio"
        | "checkbox"
        | "scale"
        | "file_upload"
        | "date"
      review_action:
        | "approved"
        | "rejected"
        | "reassigned"
        | "interview_requested"
        | "flagged"
        | "commented"
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
      app_document_type: ["profile_photo", "cv", "portfolio", "other"],
      app_role: [
        "admin",
        "user",
        "super_admin",
        "executive_secretary",
        "community_manager",
        "chief_finance_officer",
        "cfo",
        "chief_executive_director",
        "executive_director",
        "executive_assistant",
      ],
      application_status: [
        "submitted",
        "under_review",
        "interview_scheduled",
        "approved",
        "rejected",
        "reassigned",
        "withdrawn",
        "reapply_pending",
      ],
      application_type: [
        "membership",
        "volunteer",
        "program",
        "boe_appointment",
      ],
      delivery_status: ["sent", "delivered", "failed"],
      form_type: ["membership", "volunteer", "program", "custom"],
      interview_channel: ["video_call", "voice_call", "in_person"],
      interview_outcome: ["pending", "passed", "failed", "deferred"],
      letter_status: ["draft", "downloaded", "sent"],
      notification_type: [
        "acknowledgement",
        "status_update",
        "interview_invite",
        "decision",
        "reapply_unlock",
      ],
      question_type: [
        "text",
        "textarea",
        "radio",
        "checkbox",
        "scale",
        "file_upload",
        "date",
      ],
      review_action: [
        "approved",
        "rejected",
        "reassigned",
        "interview_requested",
        "flagged",
        "commented",
      ],
    },
  },
} as const
