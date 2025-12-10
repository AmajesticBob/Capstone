export interface Item {
id: string;
  user_id: string;
  name: string;
  category: string;
  color?: string;
  primary_color?: string; // The hex
  brand?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  description?: string;
}

export interface CreateItemInput {
  name: string;
  category: string;
  color?: string;
  brand?: string;
  description?: string;
  image_url?: string;
  storage_path?: string;
}
