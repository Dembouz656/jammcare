export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'provider';
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  bio?: string;
  location?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  medical_history?: string;
  allergies?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  price?: number;
  duration_minutes?: number;
  icon_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  specialization?: string;
  license_number?: string;
  license_expiry?: string;
  rating: number;
  bio?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
}

export interface Booking {
  id: string;
  user_id: string;
  provider_id: string;
  service_id: string;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  location?: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
  reviewer_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: 'card' | 'bank_transfer' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title?: string;
  message: string;
  type: 'booking' | 'payment' | 'review' | 'general';
  is_read: boolean;
  created_at: string;
}
