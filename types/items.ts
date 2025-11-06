export interface Item {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color?: string;
  brand?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItemInput {
  name: string;
  category: string;
  color?: string;
  brand?: string;
  image_url?: string;
}
