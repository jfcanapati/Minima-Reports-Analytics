export type AppRole = "client" | "receptionist" | "manager" | "inventory-controller" | "kitchen-staff" | "purchasing-officer" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

export interface UserProfile {
  email: string;
  name?: string;
  phone?: string;
  role: AppRole;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}