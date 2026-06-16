import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv, hasSupabaseReadEnv, hasSupabaseWriteEnv } from './env';

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  created_at: string;
};

type PhotographRow = {
  id: string;
  image_code: string;
  image_url: string;
  aspect_ratio: number | string;
  title: string;
  location: string;
  category: string;
  is_print_available: boolean;
  price_tier_id: string | null;
  project_id: string | null;
  created_at: string;
};

type CreatorRow = {
  id: string;
  full_name: string;
  primary_content_hub: string;
  contact_email: string;
  local_phone: string;
  creator_code: string;
  tier: string;
  status: string;
  created_at: string;
};

type OrderRow = OrderInsert & { id: string; created_at: string };

type CreatorInsert = Omit<CreatorRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

type OrderInsert = {
  tx_ref: string;
  provider: string;
  image_code: string;
  size_id: string;
  print_dimensions: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  amount_etb: number;
  currency: 'ETB';
  payment_status: string;
  fulfillment_status: string;
  receipt_url: string | null;
  metadata: Record<string, unknown>;
};

type PhotographInsert = Omit<PhotographRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      photographs: {
        Row: PhotographRow;
        Insert: PhotographInsert;
        Update: Partial<PhotographRow>;
        Relationships: [
          {
            foreignKeyName: 'photographs_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      creators: {
        Row: CreatorRow;
        Insert: CreatorInsert;
        Update: Partial<CreatorRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderInsert & { id: string; created_at: string };
        Insert: OrderInsert;
        Update: Partial<OrderInsert>;
        Relationships: [
          {
            foreignKeyName: 'orders_image_code_fkey';
            columns: ['image_code'];
            isOneToOne: false;
            referencedRelation: 'photographs';
            referencedColumns: ['image_code'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let readClient: SupabaseClient<Database> | null = null;
let serviceClient: SupabaseClient<Database> | null = null;

export type { CreatorInsert, CreatorRow, Database, OrderInsert, PhotographInsert, PhotographRow, ProjectRow };

export function getSupabaseReadClient() {
  const env = getServerEnv();
  if (!hasSupabaseReadEnv(env)) return null;

  readClient ??= createClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return readClient;
}

export function getSupabaseServiceClient() {
  const env = getServerEnv();
  if (!hasSupabaseWriteEnv(env)) return null;

  serviceClient ??= createClient<Database>(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return serviceClient;
}
