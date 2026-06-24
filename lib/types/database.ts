export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CategoryType = 'product' | 'service';
export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'viewer';
export type InquiryStatus = 'new' | 'contacted' | 'quoted' | 'closed' | 'spam';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: AdminRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: AdminRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          role?: AdminRole;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: CategoryType;
          parent_id: string | null;
          sort_order: number;
          rank_key: string;
          has_filters: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type?: CategoryType;
          parent_id?: string | null;
          sort_order?: number;
          rank_key?: string;
          has_filters?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          type?: CategoryType;
          parent_id?: string | null;
          sort_order?: number;
          rank_key?: string;
          has_filters?: boolean;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          sku: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number | null;
          stock: number;
          specs: Json;
          is_active: boolean;
          is_featured: boolean;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          sku?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price?: number | null;
          stock?: number;
          specs?: Json;
          is_active?: boolean;
          is_featured?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          sku?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number | null;
          stock?: number;
          specs?: Json;
          is_active?: boolean;
          is_featured?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          public_url: string | null;
          alt: string | null;
          content_hash: string | null;
          sort_order: number;
          is_primary: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          public_url?: string | null;
          alt?: string | null;
          content_hash?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          storage_path?: string;
          public_url?: string | null;
          alt?: string | null;
          content_hash?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_bulk_discounts: {
        Row: {
          id: string;
          product_id: string;
          min_quantity: number;
          price_per_unit: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          min_quantity: number;
          price_per_unit: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          min_quantity?: number;
          price_per_unit?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      sales_contacts: {
        Row: {
          id: string;
          name: string;
          role: string | null;
          phone: string;
          zalo: string | null;
          avatar_url: string | null;
          sort_order: number;
          rank_key: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role?: string | null;
          phone: string;
          zalo?: string | null;
          avatar_url?: string | null;
          sort_order?: number;
          rank_key?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          role?: string | null;
          phone?: string;
          zalo?: string | null;
          avatar_url?: string | null;
          sort_order?: number;
          rank_key?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_vacancies: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          location: string | null;
          salary_range: string | null;
          sort_order: number;
          rank_key: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          location?: string | null;
          salary_range?: string | null;
          sort_order?: number;
          rank_key?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string | null;
          location?: string | null;
          salary_range?: string | null;
          sort_order?: number;
          rank_key?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          customer_name: string;
          phone: string;
          email: string | null;
          product_id: string | null;
          message: string | null;
          status: InquiryStatus;
          assigned_to: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          phone: string;
          email?: string | null;
          product_id?: string | null;
          message?: string | null;
          status?: InquiryStatus;
          assigned_to?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_name?: string;
          phone?: string;
          email?: string | null;
          product_id?: string | null;
          message?: string | null;
          status?: InquiryStatus;
          assigned_to?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inquiries_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      site_contents: {
        Row: {
          id: string;
          key: string;
          value: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          actor_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      promotional_banners: {
        Row: {
          id: string;
          name: string;
          content: string;
          link_url: string | null;
          position: string;
          image_desktop_url: string | null;
          image_mobile_url: string | null;
          start_at: string | null;
          end_at: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          content: string;
          link_url?: string | null;
          position?: string;
          image_desktop_url?: string | null;
          image_mobile_url?: string | null;
          start_at?: string | null;
          end_at?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          content?: string;
          link_url?: string | null;
          position?: string;
          image_desktop_url?: string | null;
          image_mobile_url?: string | null;
          start_at?: string | null;
          end_at?: string | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_leads: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          source: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          source?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          source?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      product_spec_templates: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          name_template: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          name_template?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string | null;
          name_template?: string | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_spec_fields: {
        Row: {
          id: string;
          template_id: string;
          key: string;
          label: string;
          type: string;
          unit: string | null;
          options: Json | null;
          is_required: boolean;
          is_filterable: boolean;
          is_searchable: boolean;
          is_sortable: boolean;
          is_multiple: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          key: string;
          label: string;
          type: string;
          unit?: string | null;
          options?: Json | null;
          is_required?: boolean;
          is_filterable?: boolean;
          is_searchable?: boolean;
          is_sortable?: boolean;
          is_multiple?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          template_id?: string;
          key?: string;
          label?: string;
          type?: string;
          unit?: string | null;
          options?: Json | null;
          is_required?: boolean;
          is_filterable?: boolean;
          is_searchable?: boolean;
          is_sortable?: boolean;
          is_multiple?: boolean;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_jobs: {
        Row: {
          id: string;
          file_name: string | null;
          started_by: string | null;
          mode: string;
          status: string;
          total_rows: number;
          success_count: number;
          error_count: number;
          inserted_count: number;
          updated_count: number;
          image_count: number;
          metadata: Json;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          file_name?: string | null;
          started_by?: string | null;
          mode?: string;
          status?: string;
          total_rows?: number;
          success_count?: number;
          error_count?: number;
          inserted_count?: number;
          updated_count?: number;
          image_count?: number;
          metadata?: Json;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: {
          file_name?: string | null;
          started_by?: string | null;
          mode?: string;
          status?: string;
          total_rows?: number;
          success_count?: number;
          error_count?: number;
          inserted_count?: number;
          updated_count?: number;
          image_count?: number;
          metadata?: Json;
          finished_at?: string | null;
        };
        Relationships: [];
      };
      import_job_errors: {
        Row: {
          id: string;
          job_id: string;
          row_number: number | null;
          column_name: string | null;
          error_code: string | null;
          error_message: string | null;
          raw_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          row_number?: number | null;
          column_name?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          raw_value?: string | null;
          created_at?: string;
        };
        Update: {
          row_number?: number | null;
          column_name?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          raw_value?: string | null;
        };
        Relationships: [];
      };
      import_job_images: {
        Row: {
          id: string;
          job_id: string;
          sku: string | null;
          filename: string | null;
          storage_path: string | null;
          content_hash: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          sku?: string | null;
          filename?: string | null;
          storage_path?: string | null;
          content_hash?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          sku?: string | null;
          filename?: string | null;
          storage_path?: string | null;
          content_hash?: string | null;
          status?: string;
          error_message?: string | null;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: {
      upsert_products_by_sku: {
        Args: { p_rows: Json };
        Returns: {
          id: string;
          sku: string;
          slug: string;
          was_inserted: boolean;
        }[];
      };
      check_rate_limit: {
        Args: {
          p_rule: string;
          p_identifier: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      pick_least_loaded_agent: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: {
      admin_role: AdminRole;
      category_type: CategoryType;
      inquiry_status: InquiryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
