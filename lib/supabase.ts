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

type OrderInsert = {
  tx_ref: string;
  provider: string;
  image_code: string;
  size_id: string;
  customer_email: string | null;
  amount_cents: number;
  currency: string;
  fulfillment_state: string;
  payment_status: string;
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

export type { Database, OrderInsert, PhotographInsert, PhotographRow, ProjectRow };

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
