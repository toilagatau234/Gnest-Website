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
          name: string;
          slug: string;
          description: string | null;
          price: number | null;
          stock: number;
          specs: Json;
          is_active: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price?: number | null;
          stock?: number;
          specs?: Json;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number | null;
          stock?: number;
          specs?: Json;
          is_active?: boolean;
          is_featured?: boolean;
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
          sort_order?: number;
          is_primary?: boolean;
          is_active?: boolean;
        };
        Relationships: [];
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
        Relationships: [];
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
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
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
