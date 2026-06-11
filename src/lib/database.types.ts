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
          created_at: string;
          full_name: string;
          email: string;
          password_hash: string;
          account_number: string;
          account_type: "Savings" | "Checking" | "Premium" | "Business";
          balance: number;
          status: "pending" | "approved" | "suspended" | "rejected";
          role: "user" | "admin";
          pin_hash: string | null;
          last_login: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          type: "credit" | "debit";
          category:
            | "transfer"
            | "wire"
            | "deposit"
            | "fee"
            | "investment"
            | "loan"
            | "admin";
          amount: number;
          balance_before: number;
          balance_after: number;
          description: string;
          reference: string;
          counterparty: string | null;
          status: "completed" | "pending" | "failed";
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          title: string;
          message: string;
          type: "credit" | "debit" | "info" | "warning";
          read: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
    Functions: {
      transfer_funds: {
        Args: {
          sender_id: string;
          recipient_id: string;
          amount_kobo: number;
          description: string;
          reference: string;
        };
        Returns: Json;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbTransaction = Database["public"]["Tables"]["transactions"]["Row"];
export type DbNotification = Database["public"]["Tables"]["notifications"]["Row"];
