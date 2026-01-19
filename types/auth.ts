export type AppRole = "hotel_manager" | "finance_manager" | "operations_manager";

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface AuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

export interface UserProfile {
  email: string;
  fullName?: string;
  role: AppRole;
  landingPage: string;
  createdAt?: string;
}